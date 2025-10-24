import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = profileSchema.parse(profile);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validatedData.full_name,
          email: validatedData.email,
        })
        .eq("id", user?.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = passwordSchema.parse(passwords);

      const { error } = await supabase.auth.updateUser({
        password: validatedData.newPassword,
      });

      if (error) throw error;

      setPasswords({ newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">
                {profile.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
                id="avatar-upload"
              />
              <Label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter your email"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm new password"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
