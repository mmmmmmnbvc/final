import { Navigate } from "react-router-dom";

export default function Protected({
  children,
  allow,
}: {
  children: JSX.Element;
  allow: string[];
}) {
  const role = sessionStorage.getItem("userStatus");

  // ยังไม่ login
  if (!role) {
    return <Navigate to="/Login" replace />;
  }

  // login แล้ว แต่ role ไม่ตรง
  if (!allow.includes(role)) {
    return <Navigate to="/Login" replace />;
  }

  return children;
}