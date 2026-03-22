"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Wifi, WifiOff, RefreshCw, Download, Link2, Unlink, Plus,
  AlertCircle, CheckCircle, Settings, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiscordChannel {
  id: string;
  name: string;
  position: number;
}

interface MpdChannel {
  id: string;
  name: string;
  slug: string;
  category: string;
  discordChannelId: string | null;
}

export default function DiscordSettingsPage() {
  const [botToken, setBotToken] = useState("");
  const [guildId, setGuildId] = useState("");
  const [botStatus, setBotStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);
  const [mpdChannels, setMpdChannels] = useState<MpdChannel[]>([]);
  const [importLimit, setImportLimit] = useState(500);
  const [importingChannel, setImportingChannel] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ time: string; message: string; type: "info" | "error" | "success" }[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string, type: "info" | "error" | "success" = "info") => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString("es-ES"), message, type },
      ...prev.slice(0, 49),
    ]);
  };

  // Check bot status on mount
  useEffect(() => {
    checkBotStatus();
    loadMpdChannels();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings?keys=DISCORD_BOT_TOKEN,DISCORD_GUILD_ID");
      if (res.ok) {
        const data = await res.json();
        if (data.DISCORD_GUILD_ID) setGuildId(data.DISCORD_GUILD_ID);
        // Don't show token value for security
      }
    } catch {
      // Settings may not exist yet
    }
  };

  const loadMpdChannels = async () => {
    try {
      const res = await fetch("/api/admin/channels");
      if (res.ok) {
        const data = await res.json();
        setMpdChannels(data);
      }
    } catch (error) {
      console.error("Failed to load MPD channels:", error);
    }
  };

  const checkBotStatus = async () => {
    try {
      const res = await fetch("/api/discord/bot-status");
      const data = await res.json();
      setBotStatus(data.status === "connected" ? "connected" : "disconnected");
      if (data.botUser) {
        addLog(`Bot conectado como ${data.botUser.tag}`, "success");
      }
    } catch {
      setBotStatus("disconnected");
    }
  };

  const saveSettings = async () => {
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            ...(botToken ? [{ key: "DISCORD_BOT_TOKEN", value: botToken, category: "DISCORD" }] : []),
            { key: "DISCORD_GUILD_ID", value: guildId, category: "DISCORD" },
          ],
        }),
      });
      addLog("Configuración guardada", "success");
    } catch {
      addLog("Error guardando configuración", "error");
    }
  };

  const connectBot = async () => {
    setBotStatus("connecting");
    addLog("Conectando bot...");

    if (botToken || guildId) {
      await saveSettings();
    }

    try {
      const res = await fetch("/api/discord/start-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();

      if (data.status === "connected") {
        setBotStatus("connected");
        addLog("Bot conectado exitosamente", "success");
        // Load Discord channels after connecting
        loadDiscordChannels();
      } else {
        setBotStatus("disconnected");
        addLog(data.error || "Error conectando bot", "error");
      }
    } catch (error) {
      setBotStatus("disconnected");
      addLog("Error de conexión", "error");
    }
  };

  const disconnectBot = async () => {
    try {
      await fetch("/api/discord/start-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      setBotStatus("disconnected");
      addLog("Bot desconectado", "info");
    } catch {
      addLog("Error desconectando bot", "error");
    }
  };

  const loadDiscordChannels = async () => {
    try {
      const res = await fetch("/api/admin/discord-channels");
      if (res.ok) {
        const data = await res.json();
        setDiscordChannels(data);
      }
    } catch (error) {
      addLog("Error cargando canales de Discord", "error");
    }
  };

  const linkChannel = async (discordChannelId: string, mpdChannelId: string) => {
    try {
      const res = await fetch("/api/admin/channels/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordChannelId, mpdChannelId }),
      });
      if (res.ok) {
        addLog(`Canal vinculado exitosamente`, "success");
        loadMpdChannels();
      }
    } catch {
      addLog("Error vinculando canal", "error");
    }
  };

  const unlinkChannel = async (mpdChannelId: string) => {
    try {
      const res = await fetch("/api/admin/channels/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mpdChannelId }),
      });
      if (res.ok) {
        addLog("Canal desvinculado", "info");
        loadMpdChannels();
      }
    } catch {
      addLog("Error desvinculando canal", "error");
    }
  };

  const importHistory = async (discordChannelId: string, mpdChannelId: string) => {
    setImportingChannel(mpdChannelId);
    addLog(`Importando historial (${importLimit} mensajes)...`);

    try {
      const res = await fetch("/api/discord/import-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordChannelId, mpdChannelId, limit: importLimit }),
      });
      const data = await res.json();

      if (res.ok) {
        addLog(`Importados ${data.imported} mensajes`, "success");
      } else {
        addLog(data.error || "Error importando", "error");
      }
    } catch {
      addLog("Error de conexión durante importación", "error");
    }

    setImportingChannel(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#E6EDF3]">Sincronización Discord</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Configura el bot de Discord para sincronizar mensajes bidireccional.
        </p>
      </div>

      {/* Bot Status */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#E6EDF3] flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Bot
          </h2>
          <div className="flex items-center gap-2">
            {botStatus === "connected" ? (
              <span className="flex items-center gap-1.5 text-sm text-[#00C875]">
                <Wifi className="h-4 w-4" />
                Conectado
              </span>
            ) : botStatus === "connecting" ? (
              <span className="flex items-center gap-1.5 text-sm text-[#FF9500]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Conectando...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-[#F85149]">
                <WifiOff className="h-4 w-4" />
                Desconectado
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#8B949E] mb-1">Bot Token</label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="Introduce el token del bot de Discord"
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] placeholder:text-[#656D76] focus:border-[#C9A84C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-[#8B949E] mb-1">Guild ID (ID del servidor)</label>
            <input
              type="text"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              placeholder="ID del servidor de Discord"
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] placeholder:text-[#656D76] focus:border-[#C9A84C] focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            {botStatus === "connected" ? (
              <Button
                onClick={disconnectBot}
                variant="destructive"
                size="sm"
              >
                <WifiOff className="h-4 w-4 mr-1" />
                Desconectar Bot
              </Button>
            ) : (
              <Button
                onClick={connectBot}
                disabled={botStatus === "connecting"}
                size="sm"
                className="bg-[#C9A84C] text-[#0D1117] hover:bg-[#D4B85A]"
              >
                <Wifi className="h-4 w-4 mr-1" />
                Conectar Bot
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Channel Mapping */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#E6EDF3] flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Mapeo de Canales
          </h2>
          {botStatus === "connected" && (
            <Button onClick={loadDiscordChannels} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Recargar canales Discord
            </Button>
          )}
        </div>

        {botStatus !== "connected" ? (
          <p className="text-sm text-[#8B949E]">
            Conecta el bot para ver los canales de Discord disponibles.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363D] text-[#8B949E]">
                  <th className="text-left py-2 px-3 font-medium">Canal MPD</th>
                  <th className="text-left py-2 px-3 font-medium">Canal Discord</th>
                  <th className="text-left py-2 px-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mpdChannels.map((ch) => (
                  <tr key={ch.id} className="border-b border-[#30363D]/50 hover:bg-[#1C2128]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-[#656D76]" />
                        <span className="text-[#E6EDF3]">{ch.name}</span>
                        <span className="text-[10px] text-[#656D76] uppercase">{ch.category}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {ch.discordChannelId ? (
                        <span className="text-[#00C875] flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {discordChannels.find((dc) => dc.id === ch.discordChannelId)?.name ?? ch.discordChannelId}
                        </span>
                      ) : (
                        <select
                          onChange={(e) => {
                            if (e.target.value) linkChannel(e.target.value, ch.id);
                          }}
                          className="bg-[#0D1117] border border-[#30363D] rounded px-2 py-1 text-xs text-[#E6EDF3] focus:border-[#C9A84C] focus:outline-none"
                          defaultValue=""
                        >
                          <option value="">— Seleccionar canal —</option>
                          {discordChannels
                            .filter((dc) => !mpdChannels.some((m) => m.discordChannelId === dc.id))
                            .map((dc) => (
                              <option key={dc.id} value={dc.id}>
                                #{dc.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        {ch.discordChannelId && (
                          <>
                            <Button
                              onClick={() => unlinkChannel(ch.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-[#8B949E] hover:text-[#F85149]"
                            >
                              <Unlink className="h-3 w-3 mr-1" />
                              Desvincular
                            </Button>
                            <Button
                              onClick={() => importHistory(ch.discordChannelId!, ch.id)}
                              disabled={importingChannel === ch.id}
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-[#8B949E] hover:text-[#C9A84C]"
                            >
                              {importingChannel === ch.id ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3 mr-1" />
                              )}
                              Importar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {botStatus === "connected" && (
          <div className="mt-4 flex items-center gap-2">
            <label className="text-xs text-[#8B949E]">Mensajes a importar:</label>
            <input
              type="number"
              value={importLimit}
              onChange={(e) => setImportLimit(Number(e.target.value))}
              min={10}
              max={5000}
              className="w-20 bg-[#0D1117] border border-[#30363D] rounded px-2 py-1 text-xs text-[#E6EDF3] focus:border-[#C9A84C] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Sync Log */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6">
        <h2 className="text-lg font-semibold text-[#E6EDF3] mb-4">Log de Sincronización</h2>
        <div className="bg-[#0D1117] rounded-lg p-3 max-h-[300px] overflow-y-auto font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <p className="text-[#656D76]">Sin actividad reciente</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[#656D76] shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === "error"
                      ? "text-[#F85149]"
                      : log.type === "success"
                      ? "text-[#00C875]"
                      : "text-[#8B949E]"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
