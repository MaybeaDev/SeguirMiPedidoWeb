import { Outlet } from "react-router-dom";
import { useOutletContext } from 'react-router-dom';
import Card from "../../components/UI/Card/Card";


import classes from "./SeccionGestionDePaquetes.module.css"
import Tab from "../../components/UI/Tab/Tab";
import NavBarTab from "../../components/Layout/NavBar/NavBarTab"
import { PaqueteContext, RutaContext, TransportistaContext } from "../../components/Otros/PrivateRoutes/PrivateRoutes";
const SeccionGestionDePaquetes = () => {
    const { paquetesContext, rutasContext, transportistasContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [], rutasContext:Record<string, RutaContext>, transportistasContext:Record<string, TransportistaContext> }>();
    return (
        <div className={classes.container}>
            <NavBarTab group="gestionDeRutas">
                <Tab id="ingresarFacturacion" name={"Subir facturación"} to="ingresarFacturacion" />
                <Tab id="arriboCarga" name={"Arribo de carga"} to="arriboCarga" />
                <Tab id="despachos" name={"Despachos"} to="despachos" />
                <Tab id="verRutas" name={"Armado de Rutas"} to="armadoRutas" />
                <Tab id="verPaquetes" name={"Consultar Paquetes"} to="verPaquetes" />
                <Tab id="gestionDeRutas" name={"Gestion de Rutas"} to="gestionDeRutas" />
            </NavBarTab>
            <div className={classes.content}>
                <Card style={{ overflowX: "auto", marginTop: "0px", borderTopLeftRadius: 0, borderTopRightRadius: 0, marginInline: 20, border: "solid 2px #c77b00", borderTop: "none" }}>
                    <div style={{ minWidth: "700px" }}>
                        <Outlet context={{paquetesContext, rutasContext, transportistasContext}} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SeccionGestionDePaquetes;
