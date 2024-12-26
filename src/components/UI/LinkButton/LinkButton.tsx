import { NavLink } from "react-router-dom"

import classes from "./LinkButton.module.css"
const LinkButton = ( props : {direccion : string, nombre : string}) => {
    return (
        <NavLink className={classes.navLink} to={props.direccion}>{props.nombre}</NavLink>
    )
}

export default LinkButton;