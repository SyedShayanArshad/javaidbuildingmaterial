"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Phone, MapPin } from "lucide-react";
import {
  Card,
  Button,
  Input,
  TextArea,
  PageHeader,
  LoadingSpinner,
  Alert,
  FormGroup,
  FormRow,
  FormSection,
} from "@/components/ui";

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      const response = await fetch(`/api/vendors/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Vendor not found");

      const data = await response.json();
      setFormData({
        name: data.name,
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update vendor");
      }

      router.push("/vendors");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <LoadingSpinner fullScreen text="Loading vendor details..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push("/vendors")}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <PageHeader
        title="Edit Vendor"
        description="Update vendor information and contact details"
      />

      <div className="max-w-3xl">
        <Card>
          {error && (
            <div className="mb-6">
              <Alert variant="danger" onClose={() => setError("")}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection
              title="Vendor Information"
              description="Basic vendor details"
            >
              <div className="flex gap-4 w-full">
                <FormGroup className="flex-1">
                  <Input
                    id="name"
                    label="Vendor Name"
                    required
                    placeholder="Enter vendor name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </FormGroup>

                <FormGroup className="flex-1">
                  <Input
                    id="phone"
                    type="tel"
                    label="Phone Number"
                    placeholder="+92 3001234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    icon={<Phone className="w-4 h-4" />}
                  />
                </FormGroup>
              </div>

              <FormGroup>
                <TextArea
                  id="address"
                  label="Address"
                  rows={3}
                  placeholder="Enter vendor address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </FormGroup>
            </FormSection>
            <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                onClick={() => router.push("/vendors")}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                variant="primary"
                className="flex-1"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
