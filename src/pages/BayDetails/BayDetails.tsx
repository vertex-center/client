import Bay from "../../components/Bay/Bay";
import { useCallback, useEffect, useState } from "react";
import {
    getService,
    InstalledService,
    startService,
    stopService,
} from "../../backend/backend";
import { useParams } from "react-router-dom";

import styles from "./BayDetails.module.sass";
import Symbol from "../../components/Symbol/Symbol";
import { Horizontal } from "../../components/Layouts/Layouts";
import SSE from "../../backend/sse";
import Logs from "../../components/Logs/Logs";

type MenuItemProps = {
    symbol: string;
    name: string;
};

function MenuItem(props: MenuItemProps) {
    const { symbol, name } = props;

    return (
        <div className={styles.menuItem}>
            <Horizontal alignItems="center" gap={12}>
                <Symbol name={symbol} />
                {name}
            </Horizontal>
        </div>
    );
}

export default function BayDetails() {
    const { uuid } = useParams();

    const [instance, setInstance] = useState<InstalledService>();

    const [logs, setLogs] = useState<any[]>([]);

    const fetchInstance = useCallback(() => {
        getService(uuid).then((instance: InstalledService) => {
            setInstance(instance);
        });
    }, [uuid]);

    useEffect(() => {
        fetchInstance();
    }, [fetchInstance, uuid]);

    useEffect(() => {
        const sse = new SSE(`http://localhost:6130/service/${uuid}/events`);

        sse.on("stdout", (e) => {
            setLogs((logs) => [
                ...logs,
                {
                    message: e.data,
                },
            ]);
        });

        sse.on("status_change", (e) => {
            setInstance((instance) => ({ ...instance, status: e.data }));
        });

        return () => sse.close();
    }, [fetchInstance, uuid]);

    const toggleService = async (uuid: string) => {
        if (instance.status === "off") {
            await startService(uuid);
        } else {
            await stopService(uuid);
        }
    };

    return (
        <div className={styles.details}>
            <div className={styles.bay}>
                <Bay
                    name={instance?.name}
                    status={instance?.status}
                    onPower={() => toggleService(uuid)}
                />
            </div>
            <Horizontal>
                <div className={styles.menu}>
                    <MenuItem symbol="terminal" name="Console" />
                    {/*<MenuItem symbol="hub" name="Connections" />*/}
                    {/*<MenuItem symbol="settings" name="Settings" />*/}
                </div>
                <div className={styles.content}>
                    <Logs lines={logs} />
                </div>
            </Horizontal>
        </div>
    );
}
