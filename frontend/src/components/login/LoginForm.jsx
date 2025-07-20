import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import axios from "axios";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { setIslogin } = useContext(MyContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/signin`,
                { username, password, rememberMe },
                { withCredentials: true }
            );

            localStorage.setItem("user", JSON.stringify({
                username: res.data.username,
                roles: res.data.roles
            }));

            setIslogin(true);
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Invalid username or password.");
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
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your username"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your password"
                    required
                />
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="accent-blue-500"
                    />
                    Remember Me
                </label>
                <a onClick={() => navigate("/forgot-password")} className="text-sm text-blue-500 hover:underline">Forgot password?</a>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-2 rounded transition ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? "Signing in..." : "Sign In"}
            </button>
        </form>
    );
};

export default LoginForm;
