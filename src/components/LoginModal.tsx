"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Backdrop, // <-- Add this import
  CircularProgress, // <-- Add this import
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LogoutIcon from "@mui/icons-material/Logout"; // <-- Add this import
import AddIcon from "@mui/icons-material/Add"; // <-- Add this import
import LoginIcon from "@mui/icons-material/Login";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LineQROpenModal from "./LineQROpenModal";
import LineIcon from "./LineIcon";
import DemoVideoModal from "./DemoVideoModal";
import InclusiveLearningLogo from "./InclusiveLearningLogo";

interface LoginModalProps {
  open: boolean;
  onLoginSuccess: (sessionId: string | null) => void;
  forceSessionStep?: boolean;
  forceRegister?: boolean;
}

export default function LoginModal({ open, onLoginSuccess, forceSessionStep, forceRegister }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(""); // เพิ่ม state
  const [lastName, setLastName] = useState("");   // เพิ่ม state
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [demoVideoOpen, setDemoVideoOpen] = useState(false);

  useEffect(() => {
    if (open && forceSessionStep) {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUserId(decoded.userId);
        setLoading(true);
        fetch("/api/session/all_sessions", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) {
              // Force login on error
              localStorage.removeItem("token");
              setStep(0);
              setUserId(null);
              return [];
            }
            return res.json();
          })
          .then((sessionList) => {
            setSessions(sessionList);
            setStep(2);
          })
          .catch(() => {
            // Force login on error
            localStorage.removeItem("token");
            setStep(0);
            setUserId(null);
          })
          .finally(() => setLoading(false));
      } else {
        setStep(0);
        setUserId(null);
      }
    } else if (open && !forceSessionStep) {
      setStep(0); // Always start at welcome step
      setUserId(null);
      if (forceRegister) {
        setIsRegister(true);
      } else {
        setIsRegister(false);
      }
    }
  }, [open, forceSessionStep, forceRegister]);

  const handleLogin = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);
    if (data.token) {
      localStorage.setItem("token", data.token);
      // decode userId from token
      const decoded = JSON.parse(atob(data.token.split(".")[1]));
      setUserId(decoded.userId);

      // fetch sessions
      setLoading(true);
      const sessionRes = await fetch("/api/session/all_sessions", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const sessionList = await sessionRes.json();
      setSessions(sessionList);
      setLoading(false);
      setStep(2);
    } else {
      alert(data.error || "Login failed.");
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName }), // ส่งเพิ่ม
    });

    const data = await res.json();
    setLoading(false);
    if (data.message) {
      setIsRegister(false);
      alert("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ");
    } else {
      alert(data.error || "Registration failed.");
    }
  };

  const handleContinueSession = (sessionId: string) => {
    onLoginSuccess(sessionId);
  };

  const handleNewSession = async () => {
    if (!userId) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, configStep: 0 }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.insertedId) {
      onLoginSuccess(data.insertedId);
    } else {
      alert("Failed to create new session.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    setLoading(true);
    const res = await fetch(`/api/session`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
    });
    setLoading(false);
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } else {
      alert("Failed to delete session.");
    }
  };

  return (
    <Dialog 
      open={open} 
      disableEscapeKeyDown 
      maxWidth="md" 
      fullWidth 
      sx={{ 
        minWidth: 500,
        "& .MuiDialog-paper": {
          background: "rgba(21, 128, 61, 0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          boxShadow: "0 25px 50px -12px rgba(21, 128, 61, 0.5)",
          borderRadius: 3,
        }
      }}
    >
      {/* Loading Backdrop for LoginModal only */}
      <Backdrop
        open={loading}
        sx={{
          color: "#f0fdf4",
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: "rgba(21, 128, 61, 0.3)",
          backdropFilter: "blur(12px)",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          flexDirection: "column",
        }}
      >
        <CircularProgress sx={{ color: "#22c55e" }} />
        <Typography variant="h6" sx={{ mt: 2, color: "#f0fdf4" }}>
          กำลังดำเนินการ...
        </Typography>
      </Backdrop>
      {step === 0 ? (
        <>
          <DialogTitle sx={{ color: "#f0fdf4", fontWeight: 600, display: "flex", alignItems: "center" }}>
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                mr: 2,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(34, 197, 94, 0.3)",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "4px",
                boxShadow: "0 4px 15px 0 rgba(34, 197, 94, 0.2)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src="/chulalongkorn-logo.png"
                alt="Chulalongkorn University"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(34, 197, 94, 0.2); color: #22c55e; font-weight: bold; font-size: 10px; text-align: center;">CU</div>';
                }}
              />
            </Box>
            <InclusiveLearningLogo 
              sx={{ 
                fontSize: 35, 
                color: "#22c55e", 
                mr: 2,
                filter: "drop-shadow(0 2px 8px rgba(21, 128, 61, 0.3))"
              }} 
            />
            AI-Inclusive Classroom
          </DialogTitle>
          <DialogContent>
            <Box sx={{ minWidth: 400, py: 2, textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(240, 253, 244, 0.6)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "0.8rem",
                  mb: 2,
                }}
              >
                by Prof.Dr.Jaitip Na Songkhla and Thitanat Na Songkhla
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: "#dcfce7", fontWeight: 600 }}>
                ยินดีต้อนรับ!
              </Typography>
              <Box
                sx={{
                  maxHeight: 180,
                  overflowY: "auto",
                  background: "rgba(240, 253, 244, 0.1)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  textAlign: "left",
                  fontSize: 15,
                  whiteSpace: "pre-line",
                  color: "#dcfce7",
                }}
              >
                ห้องเรียนแบบเรียนรวม  (Inclusive Classroom) หมายถึง ห้องเรียนที่จัดให้นักเรียนที่มีความต้องการพิเศษและ
                นักเรียนทั่วไปเรียนร่วมกันในชั้นเรียนเดียวกัน โดยไม่แบ่งแยกความแตกต่างของนักเรียน 
                 ไม่ว่าจะเป็นความพิการ ความบกพร่องทางการเรียนรู้ หรือความสามารถที่แตกต่างกัน.
                   โดยมีการปรับวิธีการสอน สื่อการเรียนการสอน และสภาพแวดล้อมให้เหมาะสมกับนักเรียนแต่ละคน
                    เพื่อให้ทุกคนได้รับการศึกษาที่มีคุณภาพและเท่าเทียม
              </Box>
              <Box
                sx={{
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "rgba(240, 253, 244, 0.08)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(34, 197, 94, 0.15)",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  textAlign: "left",
                  fontSize: 15,
                  whiteSpace: "pre-line",
                  color: "#dcfce7",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ mb: 2, textAlign: "left", color: "#dcfce7" }}
                >
                  สวัสดีครับ<br />
                  ขอเรียนเชิญท่านร่วมสร้างปัญญาประดิษฐ์ห้องเรียนแบบรวม ปัญญาประดิษฐ์จะช่วยท่านออกแบบแผนการสอนเพื่อสร้างคุณภาพห้องเรียนแบบเรียนรวม
                  <br /><br />
                  1) <b>เจาะเนื้อหา:</b> เพียงท่านกำหนดเนื้อหาที่ต้องการสอน จำนวนนักเรียน ลักษณะนักเรียน ปัญญาประดิษฐ์จะตรวจสอบเนื้อหาตามมาตรฐานการเรียนรู้ตามหลักสูตรการศึกษาขั้นพื้นฐานปี 2568 และ<br />
                  2) <b>สอนเอไอ:</b> ในแต่ละส่วนของแผนการสอน ขออนุเคราะห์ท่านให้ความรู้และความเห็นตามประสบการณ์ของท่านให้กับปัญญาประดิษฐ์<br />
                  3) <b>ให้ความรู้เพิ่มเติม:</b> ท่านจะได้รับ .doc แผนการสอน ที่ท่านอาจอธิบายเพิ่มเติม และส่งกลับมาที่ <Link href="mailto:inet.chula@gmail.com" target="_blank" rel="noopener" sx={{ color: "#1976d2", fontWeight: 600 }}>inet.chula@gmail.com</Link>
                  <br /><br />
                  ข้อมูลที่ท่านให้จะถูกจัดเก็บเป็นความลับและนำไปใช้ในภาพรวม เมล์ของท่านจะได้รับการ random เพื่อส่งสิ่งของตอบแทนเป็นการขอบคุณ และจะถูกจัดแยกออกจากข้อมูลภายในไม่เกิน 6 เดือนนับตั้งแต่คำตอบที่ได้รับการจัดเก็บ ขอแสดงความขอบคุณเป็นอย่างยิ่ง
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => {
                  setIsRegister(false);
                  setStep(1);
                }}
                sx={{ 
                  mt: 2, 
                  mb: 1,
                  background: "rgba(34, 197, 94, 0.2)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#bbf7d0",
                  "&:hover": {
                    background: "rgba(34, 197, 94, 0.3)",
                    borderColor: "rgba(34, 197, 94, 0.5)",
                    boxShadow: "0 8px 25px 0 rgba(34, 197, 94, 0.4)",
                    transform: "translateY(-2px)",
                  },
                }}
                fullWidth
              >
                เข้าสู่ระบบ
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={() => setDemoVideoOpen(true)}
                sx={{ 
                  mb: 1,
                  background: "rgba(59, 130, 246, 0.15)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  color: "#bfdbfe",
                  "&:hover": {
                    background: "rgba(59, 130, 246, 0.25)",
                    borderColor: "rgba(59, 130, 246, 0.5)",
                    boxShadow: "0 8px 25px 0 rgba(59, 130, 246, 0.4)",
                    transform: "translateY(-2px)",
                  },
                }}
                fullWidth
              >
                ดูวิดีโอแนะนำการใช้งาน
              </Button>
              <Button
                variant="outlined"
                startIcon={<AppRegistrationIcon />}
                onClick={() => {
                  setIsRegister(true);
                  setStep(1);
                }}
                sx={{
                  background: "rgba(139, 92, 246, 0.15)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  color: "#c4b5fd",
                  "&:hover": {
                    background: "rgba(139, 92, 246, 0.25)",
                    borderColor: "rgba(139, 92, 246, 0.5)",
                    boxShadow: "0 8px 25px 0 rgba(139, 92, 246, 0.4)",
                    transform: "translateY(-2px)",
                  },
                }}
                fullWidth
              >
                ลงทะเบียน
              </Button>
              {/* Replace the two Line buttons with a flex row */}
              <Box sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<LineIcon />}
                  onClick={() => setLineModalOpen(true)}
                  sx={{
                    bgcolor: "#06C755",
                    color: "#fff",
                    "&:hover": { bgcolor: "#05b94a" },
                  }}
                >
                  ติดต่อสอบถาม Line OA
                </Button>
              </Box>
              <LineQROpenModal open={lineModalOpen} onClose={() => setLineModalOpen(false)} />
              <DemoVideoModal open={demoVideoOpen} onClose={() => setDemoVideoOpen(false)} />
            </Box>
          </DialogContent>
        </>
      ) : step === 1 ? (
        <>
          <DialogTitle sx={{ color: "#f0fdf4", fontWeight: 600, display: "flex", alignItems: "center" }}>
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                mr: 2,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(34, 197, 94, 0.3)",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "4px",
                boxShadow: "0 4px 15px 0 rgba(34, 197, 94, 0.2)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src="/chulalongkorn-logo.png"
                alt="Chulalongkorn University"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(34, 197, 94, 0.2); color: #22c55e; font-weight: bold; font-size: 10px; text-align: center;">CU</div>';
                }}
              />
            </Box>
            <InclusiveLearningLogo 
              sx={{ 
                fontSize: 35, 
                color: "#22c55e", 
                mr: 2,
                filter: "drop-shadow(0 2px 8px rgba(21, 128, 61, 0.3))"
              }} 
            />
            {isRegister ? "ลงทะเบียน" : "เข้าสู่ระบบ"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 400,
                mt: 1,
              }}
            >
              {isRegister && (
                <>
                  <TextField
                    fullWidth
                    label="ชื่อ"
                    variant="outlined"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(240, 253, 244, 0.1)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        "& fieldset": {
                          borderColor: "rgba(34, 197, 94, 0.2)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(34, 197, 94, 0.4)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "rgba(34, 197, 94, 0.6)",
                        },
                        "& input": {
                          color: "#f0fdf4",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "#bbf7d0",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="นามสกุล"
                    variant="outlined"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(240, 253, 244, 0.1)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        "& fieldset": {
                          borderColor: "rgba(34, 197, 94, 0.2)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(34, 197, 94, 0.4)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "rgba(34, 197, 94, 0.6)",
                        },
                        "& input": {
                          color: "#f0fdf4",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "#bbf7d0",
                      },
                    }}
                  />
                </>
              )}
              <TextField
                fullWidth
                label="อีเมล"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(240, 253, 244, 0.1)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    "& fieldset": {
                      borderColor: "rgba(34, 197, 94, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(34, 197, 94, 0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgba(34, 197, 94, 0.6)",
                    },
                    "& input": {
                      color: "#f0fdf4",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#bbf7d0",
                  },
                }}
              />
              <TextField
                fullWidth
                label="รหัสผ่าน"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(240, 253, 244, 0.1)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    "& fieldset": {
                      borderColor: "rgba(34, 197, 94, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(34, 197, 94, 0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgba(34, 197, 94, 0.6)",
                    },
                    "& input": {
                      color: "#f0fdf4",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#bbf7d0",
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, flexDirection: "column", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={isRegister ? <AppRegistrationIcon /> : <LoginIcon />}
              onClick={isRegister ? handleRegister : handleLogin}
              fullWidth
              disabled={loading}
              sx={{
                background: "rgba(34, 197, 94, 0.2)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#bbf7d0",
                "&:hover": {
                  background: "rgba(34, 197, 94, 0.3)",
                  borderColor: "rgba(34, 197, 94, 0.5)",
                  boxShadow: "0 8px 25px 0 rgba(34, 197, 94, 0.4)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              {isRegister ? "ลงทะเบียน" : "เข้าสู่ระบบ"}
            </Button>
            <Typography variant="body2" sx={{ width: "100%", textAlign: "center", color: "#dcfce7" }}>
              {isRegister ? (
                <>
                  ท่านมีบัญชีอยู่แล้ว?{" "}
                  <Link
                    component="button"
                    onClick={() => setIsRegister(false)}
                    disabled={loading}
                    underline="hover"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </>
              ) : (
                <>
                  ท่านยังไม่เป็นสมาชิก?{" "}
                  <Link
                    component="button"
                    onClick={() => setIsRegister(true)}
                    disabled={loading}
                    underline="hover"
                  >
                    ลงทะเบียน
                  </Link>
                </>
              )}
            </Typography>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ color: "#f0fdf4", fontWeight: 600, display: "flex", alignItems: "center" }}>
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                mr: 2,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(34, 197, 94, 0.3)",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "4px",
                boxShadow: "0 4px 15px 0 rgba(34, 197, 94, 0.2)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src="/chulalongkorn-logo.png"
                alt="Chulalongkorn University"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(34, 197, 94, 0.2); color: #22c55e; font-weight: bold; font-size: 10px; text-align: center;">CU</div>';
                }}
              />
            </Box>
            <InclusiveLearningLogo 
              sx={{ 
                fontSize: 35, 
                color: "#22c55e", 
                mr: 2,
                filter: "drop-shadow(0 2px 8px rgba(21, 128, 61, 0.3))"
              }} 
            />
            โปรดเลือกแผนการสอน
          </DialogTitle>
          <DialogContent>
            <List>
              {sessions.map((session) => (
                <ListItem
                  key={session._id}
                  onClick={() => handleContinueSession(session._id)}
                  sx={{ 
                    cursor: "pointer",
                    opacity: loading ? 0.5 : 1,
                    pointerEvents: loading ? "none" : "auto",
                    background: "rgba(240, 253, 244, 0.08)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid rgba(34, 197, 94, 0.15)",
                    borderRadius: 2,
                    mb: 1,
                    "&:hover": {
                      background: "rgba(240, 253, 244, 0.12)",
                      borderColor: "rgba(34, 197, 94, 0.3)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  <ListItemText
                    primary={`Session: ${session.lessonTopic || session._id}`}
                    secondary={`Step: ${session.configStep ?? 0}`}
                    sx={{
                      "& .MuiListItemText-primary": {
                        color: "#f0fdf4",
                        fontWeight: 600,
                      },
                      "& .MuiListItemText-secondary": {
                        color: "#bbf7d0",
                      },
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      color="primary"
                      onClick={() => handleContinueSession(session._id)}
                      sx={{ mr: 1 }}
                      disabled={loading}
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteSession(session._id)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleNewSession}
                disabled={loading}
                sx={{
                  background: "rgba(34, 197, 94, 0.15)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#bbf7d0",
                  "&:hover": {
                    background: "rgba(34, 197, 94, 0.25)",
                    borderColor: "rgba(34, 197, 94, 0.5)",
                    boxShadow: "0 8px 25px 0 rgba(34, 197, 94, 0.4)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                เริ่มแผนการสอนใหม่
              </Button>
            </Box>
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button
                variant="text"
                startIcon={<LogoutIcon />}
                onClick={() => {
                  localStorage.removeItem("token");
                  setStep(0);
                  setUserId(null);
                  setSessions([]);
                }}
                disabled={loading}
                sx={{
                  color: "#fecaca",
                  "&:hover": {
                    background: "rgba(239, 68, 68, 0.1)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                ออกจากระบบ
              </Button>
            </Box>
            {/* Replace the Line OA button with both buttons side by side */}
            <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<LineIcon />}
                onClick={() => setLineModalOpen(true)}
                sx={{
                  bgcolor: "#06C755",
                  color: "#fff",
                  "&:hover": { bgcolor: "#05b94a" },
                }}
              >
                ติดต่อสอบถาม Line OA
              </Button>
            </Box>
            <LineQROpenModal open={lineModalOpen} onClose={() => setLineModalOpen(false)} />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}