"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
    ShieldCheck,
    Upload,
    CheckCircle2,
    Loader2,
    Info,
    Camera,
    CreditCard,
    Image as ImageIcon,
    Hash
} from "lucide-react";
import { toast } from "sonner";

interface KYCModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

// Convert file to base64 for storage
const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });

export function KYCModal({ isOpen, onClose, userId }: KYCModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [idNumber, setIdNumber] = useState("");
    const [files, setFiles] = useState<{
        selfie: File | null;
        idFront: File | null;
        idBack: File | null;
        selfiePreview: string;
        idFrontPreview: string;
        idBackPreview: string;
    }>({
        selfie: null,
        idFront: null,
        idBack: null,
        selfiePreview: "",
        idFrontPreview: "",
        idBackPreview: ""
    });

    const handleFileChange = async (
        field: "selfie" | "idFront" | "idBack",
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file (JPG, PNG, etc).");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB.");
            return;
        }
        const preview = URL.createObjectURL(file);
        setFiles(prev => ({
            ...prev,
            [field]: file,
            [`${field}Preview`]: preview
        }));
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idNumber.trim()) {
            toast.error("Please enter your ID number.");
            return;
        }
        if (!files.selfie || !files.idFront || !files.idBack) {
            toast.error("Please upload all 3 required images.");
            return;
        }

        setLoading(true);
        try {
            // Convert images to base64 for storage in Firestore
            const [selfieB64, idFrontB64, idBackB64] = await Promise.all([
                fileToBase64(files.selfie),
                fileToBase64(files.idFront),
                fileToBase64(files.idBack)
            ]);

            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                kycStatus: "pending",
                kycSubmittedAt: serverTimestamp(),
                kycDocs: {
                    selfie: selfieB64,
                    idFront: idFrontB64,
                    idBack: idBackB64,
                    idNumber: idNumber.trim()
                }
            });

            toast.success("Identity documents submitted for review!");
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit KYC documents.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setIdNumber("");
        setFiles({ selfie: null, idFront: null, idBack: null, selfiePreview: "", idFrontPreview: "", idBackPreview: "" });
        onClose();
    };

    if (step === 2) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Submission Received">
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/30 text-emerald-500 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black text-white tracking-tight italic">Documents Submitted!</h3>
                        <p className="text-sm font-bold text-zinc-500 max-w-sm mx-auto leading-relaxed">
                            Our compliance team is reviewing your documents. Once verified, you'll unlock <span className="font-black text-blue-500">Postpaid Ads</span>. You won't need to verify again after approval.
                        </p>
                    </div>
                    <Button onClick={handleClose} className="w-full h-14 bg-white text-black font-black rounded-2xl shadow-xl transition-all active:scale-95">
                        RETURN TO PLATFORM
                    </Button>
                </div>
            </Modal>
        );
    }

    const UploadBox = ({
        field,
        label,
        icon: Icon,
        preview
    }: {
        field: "selfie" | "idFront" | "idBack";
        label: string;
        icon: any;
        preview: string;
    }) => (
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1 leading-none">{label}</Label>
            <label className="relative block cursor-pointer group">
                <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFileChange(field, e)}
                />
                <div className={`h-28 rounded-2xl border-2 border-dashed transition-all overflow-hidden flex items-center justify-center
                    ${preview ? "border-emerald-500/40 bg-emerald-500/10" : "border-zinc-700 bg-zinc-950 group-hover:border-blue-500/40 group-hover:bg-blue-500/5"}`}
                >
                    {preview ? (
                        <div className="relative w-full h-full">
                            <img src={preview} alt={label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-600 group-hover:text-blue-500 transition-colors">
                            <Icon className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Upload Image</span>
                        </div>
                    )}
                </div>
                {preview && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                )}
            </label>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Identity Verification"
            description="Upload your ID and a selfie to unlock Postpaid Ads."
        >
            <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-3xl flex gap-4 items-start">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-blue-400/80 leading-relaxed">
                        Verified once — you'll never need to re-verify. Failure to pay postpaid ad debts within 48h of campaign end will result in legal reporting.
                    </p>
                </div>

                {/* Step 1: ID Number */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1 leading-none flex items-center gap-2">
                        <Hash className="w-3 h-3" /> Government ID Number
                    </Label>
                    <div className="relative">
                        <Input
                            placeholder="e.g. NIN-123456789 or Passport No."
                            className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold text-white pr-12 placeholder:text-zinc-700 focus:border-blue-500 transition-colors"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                        />
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    </div>
                </div>

                {/* Image Uploads */}
                <div className="space-y-4">
                    <UploadBox
                        field="selfie"
                        label="1. Selfie holding your ID"
                        icon={Camera}
                        preview={files.selfiePreview}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <UploadBox
                            field="idFront"
                            label="2. ID Front"
                            icon={ImageIcon}
                            preview={files.idFrontPreview}
                        />
                        <UploadBox
                            field="idBack"
                            label="3. ID Back"
                            icon={ImageIcon}
                            preview={files.idBackPreview}
                        />
                    </div>
                </div>

                {/* Progress indicator */}
                {(files.selfie || files.idFront || files.idBack || idNumber) && (
                    <div className="flex items-center gap-2 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                        {[
                            { done: !!idNumber, label: "ID #" },
                            { done: !!files.selfie, label: "Selfie" },
                            { done: !!files.idFront, label: "ID Front" },
                            { done: !!files.idBack, label: "ID Back" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.done ? "bg-emerald-500" : "bg-zinc-700"}`}>
                                    {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${item.done ? "text-emerald-500" : "text-zinc-600"}`}>{item.label}</span>
                                {i < 3 && <span className="text-zinc-700 ml-1">·</span>}
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-[2rem] flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
                        Documents stored encrypted. Only accessible by compliance officers. Never shared with 3rd parties.
                    </p>
                </div>

                <Button
                    onClick={handleUpload}
                    disabled={loading || !files.selfie || !files.idFront || !files.idBack || !idNumber.trim()}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 flex gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            SUBMIT FOR VERIFICATION
                            <Upload className="w-5 h-5" />
                        </>
                    )}
                </Button>
            </div>
        </Modal>
    );
}
