import { NavLink } from "react-router-dom"

import classes from "./LinkButton.module.css"
const LinkButton = ( props : {direccion : string, nombre : string, onClick?:()=>void}) => {

    return (
        <NavLink onClick={props.onClick} className={classes.navLink} to={props.direccion}>{props.nombre}</NavLink>
    )
}

export default LinkButton;