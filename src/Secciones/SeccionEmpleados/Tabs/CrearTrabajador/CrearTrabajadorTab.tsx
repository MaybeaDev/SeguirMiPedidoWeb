import { useEffect, useState } from "react";
import Card from "../../../../components/UI/Card/Card";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../../../firebaseConfig";
import Button from "../../../../components/UI/Button/Button";



import classes from "./CrearTrabajadorTab.module.css";
import { sendPasswordResetEmail } from "firebase/auth";
const createUser = httpsCallable(functions, 'createUser');
const CrearTrabajador = () => {
    const [formData, setFormData] = useState({ nombre: "", rut: "", email: "", telefono: "", });
    const [errors, setErrors] = useState<{ nombre?: string, rut?: string, email?: string, telefono?: string }>({});

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            rut: formatRut(formData.rut),
        }));
    }, [formData.rut]);
    const validate = () => {
        const newErrors: { nombre?: string, rut?: string, email?: string, telefono?: string } = {};

        if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";

        const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]$/;
        if (!rutRegex.test(formData.rut)) newErrors.rut = "El RUT no es válido.";

        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRegex.test(formData.email)) newErrors.email = "El correo no es válido.";

        const telefonoRegex = /^\d{9}$/;
        if (!telefonoRegex.test(formData.telefono)) newErrors.telefono = "El teléfono debe tener 9 dígitos.";

        setErrors(newErrors);
        if (newErrors.nombre) document.getElementById("nombre")?.focus()
        else if (newErrors.rut) document.getElementById("rut")?.focus()
        else if (newErrors.email) document.getElementById("email")?.focus()
        else if (newErrors.telefono) document.getElementById("telefono")?.focus()
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        const data = { ...formData }
        e.preventDefault();
        if (validate()) {
            const trabajador = {
                correo: formData.email,
                nombre: formData.nombre,
                rut: formData.rut.replace(/\D/g, ''),
                telefono: formData.telefono,
                tipo: 0
            };
            await createUser(trabajador).then(() => {
                setFormData({ nombre: "", rut: "", email: "", telefono: "", })
                sendPasswordResetEmail(auth, normalizeString(data.email))
            }).then(() => {
            })
        }
    };
    const normalizeString = (str: string): string => {
        return str
            .normalize("NFD") // Descompone los caracteres con tildes en base + tilde
            .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes y diacríticos
            .replace(/[\u200B-\u200D\uFEFF]/g, "") // Elimina caracteres invisibles
            .replace(/\s+/g, " ") // Reemplaza múltiples espacios por uno solo
            .trim() // Elimina espacios al inicio y final
            .toLowerCase(); // Convierte a minúsculas
    };
    const formatRut = (value: string) => {

        const numbers = value.toLowerCase().replace(/[^0-9k]/gi, '');

        // Agregar puntos y guión según la cantidad de dígitos
        // Separar el dígito verificador
        if (numbers.length == 0) {
            return ""
        } else if (numbers.length == 1) {
            return numbers;
        } else {
            const dv = numbers.slice(-1);
            const numeroBase = numbers.slice(0, -1);
            // Insertar puntos cada 3 dígitos (empezando desde el inicio)
            const partes = numeroBase.split("").reverse().join('').match(/.{1,3}/g);
            const rutFormateado = (partes ?? []).join('.').split("").reverse().join('') + '-' + dv;
            // Agregar el dígito verificador con guión

            return rutFormateado;
        }
    };
    return (
        <div className={classes.container}>
            <h2>Crear Transportista</h2>
            <Card>
                <form onSubmit={handleSubmit}>
                    <center>

                        <div className={classes.formGroup}>
                            <label htmlFor="nombre">Nombre</label>
                            <input autoFocus
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                placeholder="Ej: Juan Pérez"
                                className={errors.nombre && classes.errorInput}
                                onChange={handleInputChange}
                            />
                        </div>
                    </center>
                    {errors.nombre && <p className={classes.error}>{errors.nombre}</p>}
                    <center>

                        <div className={classes.formGroup}>
                            <label htmlFor="rut">RUT</label>
                            <input
                                type="text"
                                id="rut"
                                name="rut"
                                value={formData.rut}
                                onChange={handleInputChange}
                                placeholder="12.345.678-9"
                                className={errors.rut && classes.errorInput}
                            />
                        </div>
                    </center>
                    {errors.rut && <p className={classes.error}>{errors.rut}</p>}
                    <center>

                        <div className={classes.formGroup}>
                            <label htmlFor="email">Correo</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                placeholder="Ej: john.doe@example.com"
                                className={errors.email && classes.errorInput}
                                onChange={handleInputChange}
                            />
                        </div>
                    </center>
                    {errors.email && <p className={classes.error}>{errors.email}</p>}
                    <center>

                        <div className={classes.formGroup}>
                            <label htmlFor="telefono">Teléfono</label>
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                value={formData.telefono}
                                placeholder="Ej: 912345678"
                                className={errors.telefono && classes.errorInput}
                                onChange={handleInputChange}
                            />
                        </div>
                    </center>
                    {errors.telefono && <p className={classes.error}>{errors.telefono}</p>}

                    <Button type="submit" className={classes.submitButton}>Guardar</Button>
                </form>
            </Card>
        </div>
    );
};

export default CrearTrabajador;
