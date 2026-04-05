
import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Check, X, Users, Shield } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  password: string;
  status: string;
}

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    email: string;
    username: string;
    password: string;
    status: string;
  }>({
    email: "",
    username: "",
    password: "",
    status: "",
  });

  // โหลดข้อมูลจากDB
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, password, status")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
    } else if (data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setEditData({
      email: user.email || "",
      username: user.username || "",
      password: user.password || "",
      status: user.status || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ email: "", username: "", password: "", status: "" });
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        email: editData.email,
        username: editData.username,
        password: editData.password,
        status: editData.status,
      })
      .eq("id", id);

    if (error) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } else {
      toast.success("อัปเดตข้อมูลสำเร็จ");
      fetchUsers();
      handleCancel();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("แน่ใจหรือว่าต้องการลบบัญชีนี้?")) {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) {
        toast.error("เกิดข้อผิดพลาด: " + error.message);
      } else {
        toast.success("ลบบัญชีสำเร็จ");
        fetchUsers();
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ADMIN: { variant: "default" as const, icon: Shield },
      STAFF: { variant: "secondary" as const, icon: Users },
      USER: { variant: "outline" as const, icon: Users },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.USER;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-4 md:p-8">
      <div className="mx-auto max-w-8xl">{/*max-w-7xl*/}
        
        <div className="mb-8 text-center">
          {/* <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Admin</span>
          </div> */}
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Manage Accounts</h1>
        </div>

        {/* Total Users Admin Accounts Staff Accounts User Accounts */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardDescription>Admin Accounts</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.status === "ADMIN").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardDescription>Staff Accounts</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.status === "STAFF").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardDescription>User Accounts</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.status === "USER").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>แก้ไข ลบ หรืออัปเดตข้อมูลผู้ใช้</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-muted-foreground">กำลังโหลดข้อมูล...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      ไม่พบข้อมูลผู้ใช้
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>

                      {editingId === user.id ? (
                        <>
                          <TableCell>
                            <Input
                              type="email"
                              value={editData.email}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={editData.username}
                              onChange={(e) =>
                                setEditData({ ...editData, username: e.target.value })
                              }
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={editData.password}
                              onChange={(e) =>
                                setEditData({ ...editData, password: e.target.value })
                              }
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={editData.status}
                              onValueChange={(value) =>
                                setEditData({ ...editData, status: value })
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="เลือกสถานะ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="STAFF">STAFF</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="success" onClick={() => handleSave(user.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell className="font-mono text-xs">{"•".repeat(8)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
