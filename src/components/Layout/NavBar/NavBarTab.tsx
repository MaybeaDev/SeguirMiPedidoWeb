import { ReactElement } from "react";
import classes from "./NavBarTab.module.css"
import React from "react";
const NavBarTab = (props: { children: ReactElement[], group: string }) => {

    return (
        <div className={classes.container}>
            {props.children.map((child, index) => {
                return React.cloneElement(child, { key:index, group: props.group });
            })}
        </div>
    )
}
export default NavBarTab;