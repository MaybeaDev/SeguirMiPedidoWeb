import { Link, useLocation } from "react-router-dom";


import classes from "./Tab.module.css"
const Tab = (props: { id: string, group?: string, name: string, to: string }) => {


    const location = useLocation().pathname.split("/")
    const isSelected = location[location.length - 1] === props.to

    return (
        <Link className={classes.link} to={props.to}>
            <button name={props.group} id={props.id} className={`${classes.button} ${isSelected && classes.selected}`}>
                {props.name}
            </button>
        </Link>
    )
}

export default Tab;