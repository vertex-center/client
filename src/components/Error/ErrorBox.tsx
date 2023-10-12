import styles from "./Error.module.sass";
import Icon from "../Icon/Icon";
import { HTMLProps } from "react";
import classNames from "classnames";

type Props = HTMLProps<HTMLDivElement> & {
    error?: any;
};

export default function ErrorBox(props: Readonly<Props>) {
    const { error, className, ...others } = props;

    let err = error?.message ?? "An unknown error has occurred.";

    return (
        <div className={classNames(styles.box, className)} {...others}>
            <div className={styles.error}>
                <Icon className={styles.icon} name="error" />
                <h1>Error</h1>
            </div>
            <div className={styles.content}>{err}</div>
        </div>
    );
}
