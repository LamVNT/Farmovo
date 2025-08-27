import {useState, useContext} from "react";
import {useNavigate} from "react-router-dom";
import {MyContext} from "../../App";
import axios from "axios";
import {userService} from "../../services/userService";
import { useAuth } from "../../contexts/AuthorizationContext";
import { Visibility, VisibilityOff } from '@mui/icons-material';

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const {setIslogin} = useContext(MyContext);
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    const handleTogglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/signin`,
                {username, password, rememberMe},
                {withCredentials: true}
            );

            setIslogin(true);
            // Update AuthorizationContext with new user data - this will also update localStorage
            await updateUser();
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Tên đăng nhập hoặc mật khẩu không hợp lệ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="px-10 mt-4 space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">Tên đăng nhập</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Nhập tên đăng nhập của bạn"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
                        placeholder="Nhập mật khẩu của bạn"
                        required
                    />
                    <button
                        type="button"
                        onClick={handleTogglePasswordVisibility}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        {showPassword ? <VisibilityOff className="w-5 h-5" /> : <Visibility className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="accent-blue-500"
                    />
                    Ghi nhớ đăng nhập
                </label>
                <a onClick={() => navigate("/forgot-password")} className="text-sm text-blue-500 hover:underline">Quên mật khẩu?</a>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-2 rounded transition ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
        </form>
    );
};

export default LoginForm;
