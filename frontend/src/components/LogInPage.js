import { useState } from "react";
import Register from './Register';
import LogInForm from "./LogInForm";
export default function LogInPage() {
    const [register, setRegister] = useState(false);

    return (
        <>
            {register == true ? <Register setRegister={setRegister} /> : <LogInForm setRegister={setRegister} />}
        </>
    );
}