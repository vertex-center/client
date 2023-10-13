import axios from "axios";
import { Dependencies as DependenciesUpdate } from "../../models/update";
import { About } from "../../models/about";
import { Hardware } from "../../models/hardware";
import { SSHKeys } from "../../models/security";
import { vxContainersRoutes } from "./vxContainers";
import { vxTunnelsRoutes } from "./vxTunnels";
import { vxMonitoringRoutes } from "./vxMonitoring";
import { vxSqlRoutes } from "./vxSql";
import { vxReverseProxyRoutes } from "./vxReverseProxy";
import { VertexApp } from "../../models/app";
import { Console } from "../../logging/logging";

export const server = axios.create({
    // @ts-ignore
    baseURL: `${window.apiURL}/api`,
});

// server.interceptors.response.use(async (response) => {
//     if (process.env.NODE_ENV === "development")
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//
//     return response;
// });

server.interceptors.request.use((req) => {
    if (!req) return;

    const info = {
        url: req.url,
        method: req.method,
    };

    if (req.data) info["data"] = req.data;
    if (req.params) info["params"] = req.params;

    Console.request("Sending request\n%O", info);

    return req;
});

const getAbout = async () => {
    const { data } = await server.get<About>("/about");
    return data;
};

const getHardware = async () => {
    const { data } = await server.get<Hardware>("/hardware");
    return data;
};

export const api = {
    about: getAbout,
    hardware: getHardware,

    vxContainers: vxContainersRoutes,
    vxTunnels: vxTunnelsRoutes,
    vxMonitoring: vxMonitoringRoutes,
    vxSql: vxSqlRoutes,
    vxReverseProxy: vxReverseProxyRoutes,

    apps: {
        all: async () => {
            const { data } = await server.get<VertexApp[]>("/apps");
            return data;
        },
    },

    security: {
        ssh: {
            get: async () => {
                const { data } = await server.get<SSHKeys>("/security/ssh");
                return data;
            },
            add: (authorized_key: string) =>
                server.post("/security/ssh", { authorized_key }),
            delete: (fingerprint: string) =>
                server.delete(`/security/ssh/${fingerprint}`),
        },
    },

    dependencies: {
        get: async (reload?: boolean) => {
            const { data } = await server.get<DependenciesUpdate>(
                `/dependencies${reload ? "?reload=true" : ""}`
            );
            return data;
        },
        install: (
            updates: {
                name: string;
            }[]
        ) => server.post(`/dependencies/update`, { updates }),
    },

    settings: {
        get: async () => {
            const { data } = await server.get<Settings>("/settings");
            return data;
        },
        patch: (settings: Partial<Settings>) =>
            server.patch("/settings", settings),
    },
};
