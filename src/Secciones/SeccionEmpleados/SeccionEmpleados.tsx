




import { Outlet } from "react-router-dom";
import Card from "../../components/UI/Card/Card";
import classes from "./SeccionEmpleados.module.css"
import Tab from "../../components/UI/Tab/Tab";
import NavBarTab from "../../components/Layout/NavBar/NavBarTab";
const SeccionEmpleados = () => {
    return (
        <div className={classes.container}>
            <NavBarTab group="gestionDeEmpleados">
                <Tab id="listado" name={"Listado de usuarios"} to="listado" />
                <Tab id="crearTrabajador" name={"Ingresar transportista"} to="crearTrabajador" />
            </NavBarTab>
            <div className={classes.content}>
                <Card style={{ overflowX: "auto", marginTop: "0px", borderTopLeftRadius: 0, borderTopRightRadius: 0, marginInline: 20, border: "solid 2px #c70000", borderTop: "none" }}>
                    <div style={{ minWidth: "700px" }}>
                        <Outlet />
                    </div>
                </Card>
            </div>
        </div>
    )
}


export default SeccionEmpleados;