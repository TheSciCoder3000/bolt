import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import Input from "components/form/Input"
import { loginUser, logoutUser, testTasks } from "api/auth";
import { useState } from "react";

const schema = yup.object({
    username: yup.string().required().max(25),
    password: yup.string().required().max(25),
  }).required();

type FormData = yup.InferType<typeof schema>;
type LoginErrorState = null | TApiRes;
interface TApiRes {
    status: string;
    msg: string;
}

function LoginRoute() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(schema)
    });
    const [loginError, setloginError] = useState<LoginErrorState>(null);

    const onSubmit = (data: FormData) => {
        setloginError(null);
        loginUser(data.username, data.password)
            .then(res => console.log(res))
            .catch(e => setloginError(e.response.data));
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <div className="py-10 px-48 border rounded-md">
                {/* Container Header */}
                <div className="flex flex-col items-center mb-16">
                    <h1 className="text-5xl my-5">Log In</h1>
                    <p>Don't have an account? <span>Sign Up</span></p>
                </div>

                {/* form body */}
                <form
                    className="flex flex-col mb-16 space-y-2"
                    action=""
                    onSubmit={handleSubmit(onSubmit)}>
                    <Input type="text" placeholder="Username" {...register("username")} error={errors.username?.message}/>
                    <Input type="password" placeholder="Password" {...register("password")} error={errors.password?.message}/>
                    <button type="submit">Login</button>
                </form>
                {loginError && (<div className="text-red-400">{loginError.msg}</div>)}
                <button onClick={() => logoutUser().then(res => console.log(res))}>logout</button>
                <button onClick={() => testTasks().then(res => console.log(res))}>test task</button>

            </div>
        </div>
    )
}

export default LoginRoute