import { HTMLProps } from "react";

import styles from "./Input.module.sass";
import classNames from "classnames";
import { Vertical } from "../Layouts/Layouts";
import { Caption } from "../Text/Text";

export type InputProps = HTMLProps<HTMLInputElement> & {
    description?: string;
};

export type SelectProps = HTMLProps<HTMLSelectElement> & {
    description?: string;
};

export default function Input(props: Readonly<InputProps>) {
    const { className, label, description, ...others } = props;

    return (
        <Vertical gap={10}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                {...others}
                className={classNames(styles.input, className)}
            />
            {description && (
                <Caption className={styles.description}>{description}</Caption>
            )}
        </Vertical>
    );
}
