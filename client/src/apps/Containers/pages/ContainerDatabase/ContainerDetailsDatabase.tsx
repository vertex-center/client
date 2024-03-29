import { Horizontal, Vertical } from "../../../../components/Layouts/Layouts";
import {
    KeyValueGroup,
    KeyValueInfo,
} from "../../../../components/KeyValueInfo/KeyValueInfo";
import useContainer from "../../hooks/useContainer";
import { useParams } from "react-router-dom";
import ContainerSelect from "../../components/ContainerSelect/ContainerSelect";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import { Container } from "../../backend/models";
import Progress from "../../../../components/Progress";
import { Button, FormItem, Input, Title } from "@vertex-center/components";
import { DatabaseEnvironment } from "../../backend/template";
import { APIError } from "../../../../components/Error/APIError";
import { ProgressOverlay } from "../../../../components/Progress/Progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Spacer from "../../../../components/Spacer/Spacer";
import Content from "../../../../components/Content/Content";
import { API } from "../../backend/api";
import { FloppyDiskBack } from "@phosphor-icons/react";

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
        API.getContainer(uuid)
            .then((data) => {
                setDatabase(data);
            })
            .catch(setError);
    }, [container]);

    const onDatabaseChange = (container: Container) => {
        setDatabase(container);
        onChange?.(dbID, container?.id);
    };

    const port = env?.[database?.service?.features?.databases?.[0]?.port];
    const username =
        env?.[database?.service?.features?.databases?.[0]?.username];

    if (error) return <APIError error={error} />;

    return (
        <Content>
            <Title variant="h2">{dbDefinition?.display_name}</Title>
            <Vertical gap={10}>
                {!container && <Progress infinite />}
                {container && (
                    <ContainerSelect
                        onChange={onDatabaseChange}
                        container={database}
                        filters={{
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
        </Content>
    );
}

export default function ContainerDetailsDatabase() {
    const queryClient = useQueryClient();
    const { uuid } = useParams();
    const { container, isLoading, error } = useContainer(uuid);

    const [saved, setSaved] = useState<boolean>(undefined);

    const [databases, setDatabases] = useState<{
        [name: string]: {
            container_id: string;
            db_name?: string;
        };
    }>();

    const mutationSaveDatabase = useMutation({
        mutationFn: async () => {
            await API.patchContainer(uuid, { databases });
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
        setDatabases((prev) => ({
            ...prev,
            [name]: {
                container_id: dbUUID,
            },
        }));
        setSaved(false);
    };

    const onChangeDbName = (
        e: ChangeEvent<HTMLInputElement>,
        db_name: string
    ) => {
        setDatabases((prev) => ({
            ...prev,
            [db_name]: {
                ...prev?.[db_name],
                db_name: e.target.value,
            },
        }));
        setSaved(false);
    };

    return (
        <Vertical gap={20}>
            {container &&
                Object.entries(container?.service?.databases ?? {}).map(
                    ([dbID, db]) => (
                        <Fragment key={dbID}>
                            <Database
                                dbID={dbID}
                                dbDefinition={db}
                                container={container}
                                onChange={onChange}
                            />
                            {databases?.[dbID]?.container_id && (
                                <FormItem label="Database name">
                                    <Input
                                        onChange={(e: any) =>
                                            onChangeDbName(e, dbID)
                                        }
                                    />
                                </FormItem>
                            )}
                        </Fragment>
                    )
                )}
            <ProgressOverlay show={isLoading ?? isUploading} />
            <APIError error={error ?? uploadingError} />
            <Horizontal>
                <Spacer />
                <Button
                    variant="colored"
                    onClick={async () => mutationSaveDatabase.mutate()}
                    rightIcon={<FloppyDiskBack />}
                    disabled={isUploading || saved || saved === undefined}
                >
                    Save and recreate
                </Button>
            </Horizontal>
        </Vertical>
    );
}
