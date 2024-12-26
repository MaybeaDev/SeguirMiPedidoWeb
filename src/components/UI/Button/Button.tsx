


import { ReactNode } from "react";
import classes from "./Button.module.css"
const Button = (props: { className?: string, children: ReactNode, type?: "submit" | "reset" | "button", style?: object, disabled?: boolean, onClick?: () => void }) => {
    const isDisabled = props.disabled || false;
    return (
        <button disabled={isDisabled} type={props.type ?? "button"} className={`${classes.button} ${props.className && props.className}`} style={props.style} onClick={props.onClick}>
            {props.children}
        </button>
    )
}

export default Button;