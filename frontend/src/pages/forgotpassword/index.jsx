import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const api = import.meta.env.VITE_API_URL;

    const resetMessages = () => {
        setMessage("");
        setError("");
    };

    const handleSendOTP = async () => {
        resetMessages();
        setLoading(true);
        try {
            const res = await axios.post(`${api}/forgot-password/verifyMail/${email}`);
            setMessage("📩 OTP đã được gửi đến email của bạn.");
            setStep(2);
        } catch (err) {
            console.error(err); // log chi tiết để debug
            if (err.response?.status === 404) {
                setError("❌ Email không tồn tại trong hệ thống.");
            } else {
                setError("⚠️ Đã xảy ra lỗi khi gửi OTP. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };


    const handleVerifyOTP = async () => {
        resetMessages();
        setLoading(true);
        try {
            const res = await axios.post(`${api}/forgot-password/verifyOtp/${otp}/${email}`);
            if (res.data === "OTP verified successfully") {
                setMessage("✅ OTP chính xác.");
                setStep(3);
            } else {
                setError("❌ OTP không hợp lệ hoặc đã hết hạn.");
            }
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError("❌ Xác minh OTP thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        resetMessages();
        if (password !== repeatPassword) {
            setError("❌ Mật khẩu nhập lại không khớp.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${api}/forgot-password/change-password/${email}`, {
                password,
                repeatPassword,
            });
            setMessage("✅ Mật khẩu đã được thay đổi thành công. Đang chuyển hướng...");
            setTimeout(() => navigate("/login"), 2000);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError("❌ Đổi mật khẩu thất bại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-4">Forgot Password</h2>

            {message && <p className="text-green-600 text-sm">{message}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {step === 1 && (
                <>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className={`w-full py-2 rounded text-white ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                </>
            )}

            {step === 2 && (
                <>
                    <label className="block text-sm font-medium">Nhập mã OTP</label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading}
                        className={`w-full py-2 rounded text-white ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button
                        onClick={() => setStep(1)}
                        className="w-full mt-2 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
                    >
                        ← Quay lại
                    </button>
                </>
            )}

            {step === 3 && (
                <>
                    <label className="block text-sm font-medium">Mật khẩu mới</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4"
                        required
                    />
                    <label className="block text-sm font-medium">Nhập lại mật khẩu</label>
                    <input
                        type="password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4"
                        required
                    />
                    <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className={`w-full py-2 rounded text-white ${loading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                    </button>
                    <button
                        onClick={() => setStep(2)}
                        className="w-full mt-2 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
                    >
                        ← Quay lại
                    </button>
                </>
            )}
        </div>
    );
};

export default ForgotPassword;
