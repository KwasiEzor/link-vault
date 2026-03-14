"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sparkles, Activity, Save, Loader2, Key, Globe, Cpu, Lock, ShieldCheck, CheckCircle2, AlertCircle, Zap, XCircle } from "lucide-react";
import { updateSettings, testOpenAIConnection, testInngestConnection } from "@/app/actions/settings";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_MODELS = [
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "GPT-4o Mini", value: "gpt-4o-mini" },
  { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
  { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
  { label: "Llama 3 70B (Groq)", value: "llama3-70b-8192" },
  { label: "Custom Model", value: "custom" },
];

const settingsSchema = z.object({
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  AI_MODEL: z.string().optional(),
  AI_MODEL_SELECT: z.string(),
  AI_ENABLED: z.boolean(),
  HEALTH_CHECK_ENABLED: z.boolean(),
  METADATA_SCRAPING_ENABLED: z.boolean(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialSettings: Record<string, string | boolean>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [isTestingInngest, setIsTestingInngest] = useState(false);
  const [aiStatus, setAiStatus] = useState<null | { success: boolean; message: string; testedAt: number }>(null);
  const [inngestStatus, setInngestStatus] = useState<null | { success: boolean; message: string; testedAt: number }>(null);

  const [aiKeyMeta, setAiKeyMeta] = useState(() => ({
    present: !!initialSettings.AI_API_KEY_PRESENT,
    source: ((initialSettings.AI_API_KEY_SOURCE as string) || "none") as "db" | "env" | "none",
  }));
  const [inngestEventKeyMeta, setInngestEventKeyMeta] = useState(() => ({
    present: !!initialSettings.INNGEST_EVENT_KEY_PRESENT,
    source: ((initialSettings.INNGEST_EVENT_KEY_SOURCE as string) || "none") as "db" | "env" | "none",
  }));
  const [inngestSigningKeyMeta, setInngestSigningKeyMeta] = useState(() => ({
    present: !!initialSettings.INNGEST_SIGNING_KEY_PRESENT,
    source: ((initialSettings.INNGEST_SIGNING_KEY_SOURCE as string) || "none") as "db" | "env" | "none",
  }));
  
  const initialModel = (initialSettings.AI_MODEL as string) || "gpt-3.5-turbo";
  const isPreset = PRESET_MODELS.some(m => m.value === initialModel);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      // Never hydrate secrets into the client.
      AI_API_KEY: "",
      AI_BASE_URL: (initialSettings.AI_BASE_URL as string) || "https://api.openai.com/v1",
      AI_MODEL: initialModel,
      AI_MODEL_SELECT: isPreset ? initialModel : "custom",
      AI_ENABLED: initialSettings.AI_ENABLED !== false,
      HEALTH_CHECK_ENABLED: initialSettings.HEALTH_CHECK_ENABLED !== false,
      METADATA_SCRAPING_ENABLED: initialSettings.METADATA_SCRAPING_ENABLED !== false,
      INNGEST_EVENT_KEY: "",
      INNGEST_SIGNING_KEY: "",
    },
  });

  const selectedModelType = form.watch("AI_MODEL_SELECT");
  const aiApiKeyValue = form.watch("AI_API_KEY") || "";
  const aiBaseUrlValue = form.watch("AI_BASE_URL") || "";
  const aiModelSelectValue = form.watch("AI_MODEL_SELECT") || "";
  const aiModelValue = form.watch("AI_MODEL") || "";
  const inngestEventKeyValue = form.watch("INNGEST_EVENT_KEY") || "";
  const inngestSigningKeyValue = form.watch("INNGEST_SIGNING_KEY") || "";

  const lastAiFingerprintRef = useRef<string>("");
  const lastInngestFingerprintRef = useRef<string>("");

  useEffect(() => {
    const fingerprint = [aiApiKeyValue, aiBaseUrlValue, aiModelSelectValue, aiModelValue].join("|");

    if (lastAiFingerprintRef.current && lastAiFingerprintRef.current !== fingerprint) {
      setAiStatus(null);
    }
    lastAiFingerprintRef.current = fingerprint;
  }, [aiApiKeyValue, aiBaseUrlValue, aiModelSelectValue, aiModelValue]);

  useEffect(() => {
    const fingerprint = [inngestEventKeyValue, inngestSigningKeyValue].join("|");

    if (lastInngestFingerprintRef.current && lastInngestFingerprintRef.current !== fingerprint) {
      setInngestStatus(null);
    }
    lastInngestFingerprintRef.current = fingerprint;
  }, [inngestEventKeyValue, inngestSigningKeyValue]);

  const onSubmit = async (values: SettingsValues) => {
    setIsSaving(true);
    try {
      const dataToSave: Record<string, string | boolean> = { ...values };
      // If a preset is selected, use it as the model
      if (values.AI_MODEL_SELECT !== "custom") {
        dataToSave.AI_MODEL = values.AI_MODEL_SELECT;
      }
      
      // Avoid overwriting saved secrets with blanks. Save secrets only when explicitly provided.
      if (!values.AI_API_KEY) delete dataToSave.AI_API_KEY;
      if (!values.INNGEST_EVENT_KEY) delete dataToSave.INNGEST_EVENT_KEY;
      if (!values.INNGEST_SIGNING_KEY) delete dataToSave.INNGEST_SIGNING_KEY;

      // Remove the UI-only field before saving
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { AI_MODEL_SELECT, ...finalData } = dataToSave;
      
      await updateSettings(finalData as Record<string, string | boolean>);
      toast.success("Settings updated successfully!");

      if (values.AI_API_KEY === "__CLEAR__") setAiKeyMeta({ present: false, source: "none" });
      else if (values.AI_API_KEY) setAiKeyMeta({ present: true, source: "db" });

      if (values.INNGEST_EVENT_KEY === "__CLEAR__") setInngestEventKeyMeta({ present: false, source: "none" });
      else if (values.INNGEST_EVENT_KEY) setInngestEventKeyMeta({ present: true, source: "db" });

      if (values.INNGEST_SIGNING_KEY === "__CLEAR__") setInngestSigningKeyMeta({ present: false, source: "none" });
      else if (values.INNGEST_SIGNING_KEY) setInngestSigningKeyMeta({ present: true, source: "db" });
    } catch (error) {
      toast.error("Failed to update settings.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const onTestAI = async () => {
    const apiKeyRaw = form.getValues("AI_API_KEY") ?? "";
    const apiKey = apiKeyRaw === "__CLEAR__" ? "" : apiKeyRaw;
    const baseURL = form.getValues("AI_BASE_URL") ?? "";
    
    if (!apiKey && !aiKeyMeta.present) {
      toast.error("No API key found. Add one in the field or via environment variables.");
      return;
    }

    setIsTestingAI(true);
    setAiStatus(null);
    try {
      const result = await testOpenAIConnection(apiKey, baseURL || "");
      setAiStatus({ ...result, testedAt: Date.now() });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An unexpected error occurred during testing");
    } finally {
      setIsTestingAI(false);
    }
  };

  const onTestInngest = async () => {
    const eventKeyRaw = form.getValues("INNGEST_EVENT_KEY") ?? "";
    const signingKeyRaw = form.getValues("INNGEST_SIGNING_KEY") ?? "";
    const eventKey = eventKeyRaw === "__CLEAR__" ? "" : eventKeyRaw;
    const signingKey = signingKeyRaw === "__CLEAR__" ? "" : signingKeyRaw;
    
    if (!eventKey && !inngestEventKeyMeta.present) {
      toast.error("No Event key found. Add one in the field or via environment variables.");
      return;
    }

    setIsTestingInngest(true);
    setInngestStatus(null);
    try {
      const result = await testInngestConnection(eventKey, signingKey || "");
      setInngestStatus({ ...result, testedAt: Date.now() });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An unexpected error occurred during testing");
    } finally {
      setIsTestingInngest(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* AI Enrichment Settings */}
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="glass border-white/5 overflow-hidden rounded-[2.5rem] bg-[#020617]/40">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-white">AI Enrichment</CardTitle>
                            <CardDescription>Configure how AI analyzes your links.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="space-y-0.5">
                            <Label htmlFor="ai-enabled" className="text-base font-bold text-white">Enable AI</Label>
                            <p className="text-xs text-muted-foreground">Automatically categorize and summarize new links.</p>
                        </div>
                        <input
                            id="ai-enabled"
                            type="checkbox"
                            className="h-6 w-6 rounded-lg bg-white/10 border-white/10 text-primary focus:ring-primary transition-all cursor-pointer"
                            {...form.register("AI_ENABLED")}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Key className="h-3 w-3" /> API Key
                                </Label>
                                {aiKeyMeta.present && (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Saved ({aiKeyMeta.source})
                                  </span>
                                )}
                                {aiStatus && (
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${aiStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {aiStatus.success ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                        {aiStatus.success ? 'Connected' : 'Failed'}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <Input 
                                    type="password" 
                                    placeholder={aiKeyMeta.present ? "Saved (leave blank to keep)" : "sk-..."} 
                                    className="glass-input h-12 rounded-xl pr-24"
                                    {...form.register("AI_API_KEY")}
                                />
                                <div className="absolute right-2 top-1.5 z-10">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={onTestAI}
                                        disabled={isTestingAI}
                                        className={cn(
                                            "h-9 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-300",
                                            !aiStatus && "hover:bg-white/10",
                                            aiStatus?.success && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20",
                                            aiStatus && !aiStatus.success && "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/20"
                                        )}
                                    >
                                        {isTestingAI ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : aiStatus?.success ? (
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                        ) : aiStatus && !aiStatus.success ? (
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                            <Zap className="h-3 w-3 mr-1" />
                                        )}
                                        {aiStatus?.success ? 'Connected' : aiStatus && !aiStatus.success ? 'Failed' : 'Test'}
                                    </Button>
                                </div>
                            </div>
                            {aiStatus && (
                              <p className={cn(
                                "text-[11px] font-medium",
                                aiStatus.success ? "text-emerald-400/80" : "text-rose-400/80"
                              )}>
                                {aiStatus.message}
                              </p>
                            )}
                            {aiKeyMeta.present && aiKeyMeta.source === "db" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  form.setValue("AI_API_KEY", "__CLEAR__");
                                  toast("API key will be cleared on save.");
                                }}
                                className="h-8 px-2 rounded-lg text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:bg-white/5 hover:text-white"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Clear Saved Key
                              </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Globe className="h-3 w-3" /> Base URL
                            </Label>
                            <Input 
                                placeholder="https://api.openai.com/v1" 
                                className="glass-input h-12 rounded-xl"
                                {...form.register("AI_BASE_URL")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Cpu className="h-3 w-3" /> AI Model
                            </Label>
                            <Select 
                                {...form.register("AI_MODEL_SELECT")}
                                className="h-12 rounded-xl"
                            >
                                {PRESET_MODELS.map(model => (
                                    <option key={model.value} value={model.value} className="bg-slate-900">
                                        {model.label}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <AnimatePresence>
                            {selectedModelType === "custom" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            Custom Model Identifier
                                        </Label>
                                        <Input 
                                            placeholder="e.g. claude-3-opus-20240229" 
                                            className="glass-input h-12 rounded-xl border-primary/20"
                                            {...form.register("AI_MODEL")}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Inngest / Background Settings */}
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            <Card className="glass border-white/5 overflow-hidden rounded-[2.5rem] bg-[#020617]/40 h-full">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-white">Background Tasks</CardTitle>
                            <CardDescription>Manage automated jobs and security keys.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="space-y-0.5">
                                <Label htmlFor="health-check" className="text-base font-bold text-white">Health Checks</Label>
                                <p className="text-xs text-muted-foreground">Periodically verify if saved links are still active.</p>
                            </div>
                            <input
                                id="health-check"
                                type="checkbox"
                                className="h-6 w-6 rounded-lg bg-white/10 border-white/10 text-primary focus:ring-primary transition-all cursor-pointer"
                                {...form.register("HEALTH_CHECK_ENABLED")}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="space-y-0.5">
                                <Label htmlFor="metadata-scraping" className="text-base font-bold text-white">Metadata Scraping</Label>
                                <p className="text-xs text-muted-foreground">Scrape title and description when a link is added.</p>
                            </div>
                            <input
                                id="metadata-scraping"
                                type="checkbox"
                                className="h-6 w-6 rounded-lg bg-white/10 border-white/10 text-primary focus:ring-primary transition-all cursor-pointer"
                                {...form.register("METADATA_SCRAPING_ENABLED")}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" /> Inngest Security
                            </h4>
                            {inngestStatus && (
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${inngestStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {inngestStatus.success ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                    {inngestStatus.success ? 'Connected' : 'Failed'}
                                </span>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Key className="h-3 w-3" /> Event Key
                                </Label>
                                <div className="relative">
                                    <Input 
                                        type="password"
                                        placeholder={inngestEventKeyMeta.present ? "Saved (leave blank to keep)" : "inngest_event_..."} 
                                        className="glass-input h-12 rounded-xl pr-24"
                                        {...form.register("INNGEST_EVENT_KEY")}
                                    />
                                    <div className="absolute right-2 top-1.5 z-10">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={onTestInngest}
                                        disabled={isTestingInngest}
                                        className={cn(
                                            "h-9 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-300",
                                            !inngestStatus && "hover:bg-white/10",
                                            inngestStatus?.success && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20",
                                            inngestStatus && !inngestStatus.success && "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/20"
                                        )}
                                    >
                                        {isTestingInngest ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : inngestStatus?.success ? (
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                        ) : inngestStatus && !inngestStatus.success ? (
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                            <Zap className="h-3 w-3 mr-1" />
                                        )}
                                        {inngestStatus?.success ? 'Connected' : inngestStatus && !inngestStatus.success ? 'Failed' : 'Test'}
                                    </Button>
                                </div>
                                </div>
                            </div>
                            {inngestEventKeyMeta.present && (
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Saved ({inngestEventKeyMeta.source})
                              </p>
                            )}
                            {inngestStatus && (
                              <p className={cn(
                                "text-[11px] font-medium",
                                inngestStatus.success ? "text-emerald-400/80" : "text-rose-400/80"
                              )}>
                                {inngestStatus.message}
                              </p>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Lock className="h-3 w-3" /> Signing Key
                                </Label>
                                <Input 
                                    type="password"
                                    placeholder={inngestSigningKeyMeta.present ? "Saved (leave blank to keep)" : "sign_..."} 
                                    className="glass-input h-12 rounded-xl"
                                    {...form.register("INNGEST_SIGNING_KEY")}
                                />
                                {inngestSigningKeyMeta.present && (
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Saved ({inngestSigningKeyMeta.source})
                                  </p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <Button 
            type="submit" 
            disabled={isSaving}
            className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
        >
            {isSaving ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Configuration...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-5 w-5" />
                    Commit System Changes
                </>
            )}
        </Button>
      </div>
    </form>
  );
}
