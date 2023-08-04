import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import Input from "components/form/Input"
import { registerUser } from "api/auth";
import { Link, useNavigate } from "react-router-dom";
import Button from "components/form/Button";

const schema = yup.object({
    username: yup.string().required().max(25),
    password: yup.string().required().max(25),
  }).required();
type FormData = yup.InferType<typeof schema>;

function RegisterRoute() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(schema)
    });
    const navigate = useNavigate()

    const onSubmit = (data: FormData) => {
        registerUser(data.username, data.password)
            .then(res => {
                console.log(res)
                navigate("/login")
            })
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <div className="py-10 px-48 border rounded-md">
                {/* Container Header */}
                <div className="flex flex-col items-center mb-16">
                    <h1 className="text-5xl my-5">Sign Up</h1>
                    <p>Already have an account? <Link className="text-blue-600 hover:text-blue-600/70" to={"/login"}>Log In</Link></p>
                </div>

                {/* form body */}
                <form
                    className="flex flex-col mb-16 space-y-6"
                    action=""
                    onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-2">
                            <Input type="text" placeholder="Username" {...register("username")} error={errors.username?.message}/>
                            <Input type="password" placeholder="Password" {...register("password")} error={errors.password?.message}/>
                        </div>
                        <Button type="submit">Sign In</Button>
                </form>
            </div>
        </div>
    )
}

export default RegisterRoute