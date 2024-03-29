import {
    Link,
    LinkProps as RouterLinkProps,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { useApps } from "../../hooks/useApps";
import {
    DropdownItem,
    Header,
    HeaderItem,
    LinkProps,
    ProfilePicture,
} from "@vertex-center/components";
import useAuth from "../../apps/Auth/hooks/useAuth";
import { Fragment } from "react";
import { Gear, SignIn, SignOut } from "@phosphor-icons/react";

type Props = {
    title?: string;
    onClick?: () => void;
};

export default function (props: Readonly<Props>) {
    const { onClick } = props;
    const { apps } = useApps();
    const { isLoggedIn } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    let to = "/containers";
    let app = apps?.find((app) => location.pathname.includes(`/${app.id}`));
    if (app) {
        to = `/${app.id}`;
    }

    const linkLogo: LinkProps<RouterLinkProps> = {
        as: Link,
        to,
    };

    let accountItems;
    if (isLoggedIn) {
        accountItems = (
            <Fragment>
                <DropdownItem
                    icon={<Gear />}
                    onClick={() => navigate("/account/info")}
                >
                    Settings
                </DropdownItem>
                <DropdownItem
                    icon={<SignOut />}
                    red
                    onClick={() => navigate("/logout")}
                >
                    Logout
                </DropdownItem>
            </Fragment>
        );
    } else {
        accountItems = (
            <DropdownItem icon={<SignIn />} onClick={() => navigate("/login")}>
                Login
            </DropdownItem>
        );
    }

    const account = (
        <HeaderItem items={accountItems}>
            <ProfilePicture size={36} />
        </HeaderItem>
    );

    return (
        <Header
            onClick={onClick}
            appName={app?.name}
            linkLogo={linkLogo}
            trailing={account}
        />
    );
}
