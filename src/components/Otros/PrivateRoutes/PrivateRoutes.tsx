import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { collection, DocumentData, onSnapshot, query, QueryDocumentSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
export interface RutaContext {
    id: string;
    alias: string,
    transportista: string,
    transportistaNombre: string,
    activa: boolean,
    cargado: boolean,
    enReparto: boolean,
    completado: boolean,
}
export interface TransportistaContext {
    correo: string,
    nombre: string,
    rut: string,
    telefono: string,
    id: string,
}
export interface PaqueteContext {
    id: string;
    campaña: string;
    consultora: string;
    contacto: string;
    direccion: string;
    estado: number;
    facturacion: string;
    historial: {
        fecha: Timestamp,
        estado: number,
        detalles: string,
    }[];
    receptor: string;
    referencia: string;
    ruta: string;
    rutaAlias: string;
    transportista: string
    transportistaNombre: string
}
const PrivateRoute: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [paquetesContext, setPaquetes] = useState<PaqueteContext[]>([]);
    const [rutasContext, setRutas] = useState<Record<string, RutaContext>>({});
    const [transportistasContext, setTransportistas] = useState<Record<string, TransportistaContext>>({});

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        getTransportistas()
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { getRutas() }, [transportistasContext])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (Object.keys(rutasContext).length != 0 && paquetesContext.length == 0) { getPaquetes() } }, [rutasContext])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPaquetes(paquetesContext.map(p => buscarTransportista(p))); console.log("Cambios en transportistasContext") }, [transportistasContext])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setPaquetes(paquetesContext.map(p => buscarRuta(p))); console.log("Cambios en rutasContext") }, [rutasContext])


    const getPaquetes = () => {
        const q = query(collection(db, "Paquetes"));
        onSnapshot(q, async (querySnapshot) => {
            const paq: PaqueteContext[] = [];
            querySnapshot.forEach((doc) => {
                const paquete = buscarRutaYTransportista(doc)
                if (paquete != undefined) {
                    paq.push(paquete)
                }
            })
            console.log("Paquetes cambiados")
            paq.sort((a, b) => b.id.localeCompare(a.id));
            paq.sort((a, b) => {
                return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
            });
            setPaquetes(paq);
        })
    };
    const getRutas = () => {
        const q = query(collection(db, "Rutas"));
        onSnapshot(q, (querySnapshot) => {
            const rutas: { [key: string]: RutaContext } = {}
            querySnapshot.forEach((doc) => {
                const alias = doc.data().alias.trim()
                const ruta: RutaContext = {
                    id: doc.id,
                    alias: alias.charAt(0).toUpperCase() + alias.slice(1).toLowerCase(),
                    transportista: doc.data().transportista ?? "",
                    transportistaNombre: doc.data().transportistaNombre ?? "",
                    activa: doc.data().activa,
                    cargado: doc.data().cargado,
                    enReparto: doc.data().en_reparto,
                    completado: doc.data().completado
                }
                if (ruta.transportistaNombre != undefined) {
                    ruta.transportistaNombre = capitalize(ruta.transportistaNombre)
                }
                if (ruta.transportistaNombre == "" && ruta.transportista != "") {
                    const transportista = transportistasContext[ruta.transportista]
                    if (transportista != undefined) {
                        ruta.transportistaNombre = capitalize(transportista.nombre)
                    }
                }
                rutas[ruta.id] = ruta
            })
            setRutas(rutas)
        })
    }
    const getTransportistas = () => {
        const q = query(collection(db, "Usuarios"), where("tipo", "==", 0));
        onSnapshot(q, (querySnapshot) => {
            const transportistas: { [key: string]: TransportistaContext } = {}
            querySnapshot.forEach((doc) => {
                const transportista: TransportistaContext = {
                    correo: doc.data().correo,
                    nombre: capitalize(doc.data().nombre),
                    rut: doc.data().rut,
                    telefono: doc.data().telefono,
                    id: doc.id
                }
                transportistas[transportista.id] = transportista
            })
            setTransportistas(transportistas)
        })
    }

    const buscarTransportista = (paquete: PaqueteContext) => {
        paquete.transportistaNombre = capitalize(paquete.transportistaNombre)
        const transportista = transportistasContext[paquete.transportista]
        if (transportista) {
            if (paquete.transportistaNombre == "") {
                paquete.transportistaNombre = capitalize(transportista.nombre)
            }
        }
        return paquete;
    }
    const buscarRuta = (paquete: PaqueteContext) => {
        if (paquete.ruta != "") {
            const r = rutasContext[paquete.ruta]
            if (r) {
                if (paquete.rutaAlias == "") {
                    const alias = r.alias.trim()
                    paquete.rutaAlias = alias.charAt(0).toUpperCase() + alias.slice(1).toLowerCase()
                } else {
                    paquete.rutaAlias = paquete.rutaAlias.charAt(0).toUpperCase() + paquete.rutaAlias.slice(1).toLowerCase()
                }
                if (paquete.transportista == "") {
                    paquete.transportista = r.transportista
                    paquete.transportistaNombre = capitalize(r.transportistaNombre)
                }
            }
        }
        return paquete;
    }
    const buscarRutaYTransportista = (doc: QueryDocumentSnapshot<DocumentData, DocumentData>): PaqueteContext | undefined => {
        if (doc.data() !== undefined) {
            const paquete: PaqueteContext = {
                id: doc.id,
                campaña: doc.data().campania ?? "",
                consultora: doc.data().consultora ?? "",
                contacto: doc.data().contacto ?? "",
                direccion: doc.data().direccion ?? "",
                estado: doc.data().estado,
                facturacion: doc.data().facturacion ?? "",
                historial: doc.data().historial ?? [],
                receptor: doc.data().receptor ?? "",
                referencia: doc.data()!.referencia ?? doc.data()!.ciudad ?? "",

                ruta: doc.data().ruta ?? "",
                rutaAlias: doc.data().rutaAlias ?? "",
                transportista: doc.data().transportista ?? "",
                transportistaNombre: doc.data().transportistaNombre ?? ""
            }
            if (paquete.transportistaNombre != "") paquete.transportistaNombre = capitalize(paquete.transportistaNombre)

            if (paquete.transportista != "" && paquete.transportistaNombre == "") {
                const transportista = transportistasContext[paquete.transportista] ?? null
                if (transportista != null) {
                    paquete.transportistaNombre = capitalize(transportista.nombre)
                } else {
                    paquete.transportistaNombre = capitalize(paquete.transportista)
                }
            }
            if (paquete.ruta != "") {
                const r = rutasContext[paquete.ruta]
                if (paquete.rutaAlias == "" && r) {
                    const alias = r.alias.trim()
                    paquete.rutaAlias = alias.charAt(0).toUpperCase() + alias.slice(1).toLowerCase()
                } else {
                    paquete.rutaAlias = paquete.rutaAlias.charAt(0).toUpperCase() + paquete.rutaAlias.slice(1).toLowerCase()
                }
                if (paquete.transportista == "" && r) {
                    paquete.transportista = r.transportista
                    paquete.transportistaNombre = capitalize(r.transportistaNombre)
                }
            }
            return paquete
        }
    }
    function capitalize(str: string): string {
        return str
            .trim()
            .split(" ") // Dividir la cadena en palabras
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalizar cada palabra
            .join(" "); // Unir las palabras nuevamente
    }




    if (loading) { return <div>Loading...</div>; }
    if (!user) { return <Navigate to="/login" />; }
    return <Outlet context={{ paquetesContext, rutasContext, transportistasContext }} />;
};

export default PrivateRoute;
