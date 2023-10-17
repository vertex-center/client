import { Vertical } from "../../../../components/Layouts/Layouts";

import styles from "./ContainerDetailsDatabase.module.sass";
import { Title } from "../../../../components/Text/Text";
import {
    KeyValueGroup,
    KeyValueInfo,
} from "../../../../components/KeyValueInfo/KeyValueInfo";
import useContainer from "../../hooks/useContainer";
import { useParams } from "react-router-dom";
import ContainerSelect from "../../../../components/Input/ContainerSelect";
import { useEffect, useState } from "react";
import { Container } from "../../../../models/container";
import Progress from "../../../../components/Progress";
import Button from "../../../../components/Button/Button";
import { api } from "../../../../backend/api/backend";
import { DatabaseEnvironment } from "../../../../models/service";
import { APIError } from "../../../../components/Error/APIError";
import { ProgressOverlay } from "../../../../components/Progress/Progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DatabaseProps = {
    container?: Container;

    dbID?: string;
    dbDefinition?: DatabaseEnvironment;

    onChange?: (name: string, dbUUID: string) => void;
};

function Database(props: Readonly<DatabaseProps>) {
    const { container, dbID, dbDefinition, onChange } = props;

    const [database, setDatabase] = useState<Container>();
    const [error, setError] = useState();

    const env = database?.environment;

    useEffect(() => {
        const uuid = container?.databases?.[dbID];
        if (uuid === undefined) return;
        api.vxContainers
            .container(uuid)
            .get()
            .then((data) => {
                setDatabase(data);
            })
            .catch(setError);
    }, [container]);

    const onDatabaseChange = (container: Container) => {
        setDatabase(container);
        onChange?.(dbID, container?.uuid);
    };

    const port = env?.[database?.service?.features?.databases?.[0]?.port];
    const username =
        env?.[database?.service?.features?.databases?.[0]?.username];

    if (error) return <APIError error={error} />;

    return (
        <Vertical gap={20}>
            <Title className={styles.title}>{dbDefinition?.display_name}</Title>
            <Vertical gap={10}>
                {!container && <Progress infinite />}
                {container && (
                    <ContainerSelect
                        onChange={onDatabaseChange}
                        container={database}
                        query={{
                            features: dbDefinition?.types,
                        }}
                    />
                )}
                {database && (
                    <KeyValueGroup>
                        <KeyValueInfo name="Type" type="code">
                            {database?.service?.features?.databases?.[0]?.type}
                        </KeyValueInfo>
                        <KeyValueInfo name="Port" type="code">
                            {port}
                        </KeyValueInfo>
                        <KeyValueInfo name="Username" type="code">
                            {username}
                        </KeyValueInfo>
                        <KeyValueInfo name="Password" type="code">
                            ***
                        </KeyValueInfo>
                    </KeyValueGroup>
                )}
            </Vertical>
        </Vertical>
    );
}

export default function ContainerDetailsDatabase() {
    const queryClient = useQueryClient();
    const { uuid } = useParams();
    const { container, isLoading, error } = useContainer(uuid);

    const [saved, setSaved] = useState<boolean>(undefined);

    const [databases, setDatabases] = useState<{
        [name: string]: string;
    }>();

    const mutationSaveDatabase = useMutation({
        mutationFn: async () => {
            await api.vxContainers.container(uuid).patch({ databases });
        },
        onSuccess: () => {
            setSaved(true);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["containers", uuid],
            });
        },
    });
    const { isLoading: isUploading, error: uploadingError } =
        mutationSaveDatabase;

    const onChange = (name: string, dbUUID: string) => {
        setDatabases((prev) => ({ ...prev, [name]: dbUUID }));
        setSaved(false);
    };

    return (
        <Vertical gap={20}>
            {container &&
                Object.entries(container?.service?.databases ?? {}).map(
                    ([dbID, db]) => (
                        <Database
                            key={dbID}
                            dbID={dbID}
                            dbDefinition={db}
                            container={container}
                            onChange={onChange}
                        />
                    )
                )}
            <ProgressOverlay show={isLoading ?? isUploading} />
            <APIError error={error ?? uploadingError} />
            <Button
                primary
                large
                onClick={async () => mutationSaveDatabase.mutate()}
                rightIcon="save"
                loading={isUploading}
                disabled={saved || saved === undefined}
            >
                Save{" "}
                {container?.install_method === "docker" &&
                    "+ Recreate container"}
            </Button>
        </Vertical>
    );
}