
import classes from "./Content.module.css"
import { ReactNode } from "react";
const Content = (props : {children:ReactNode}) => {
    return (
        <div className={classes.container}>
            {props.children}
        </div>
    )
}

export default Content;