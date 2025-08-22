"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Grid,
  Typography,
  Button,
  Backdrop,
  CircularProgress,
  Box,
} from "@mui/material";
import axios from "axios";
import ChatInput from "../../components/ChatInput";
import JsonResponse from "../../components/JsonResponse";
import ConfigModal, { stepConfigFields } from "../../components/ConfigModal";
import PdfResponse from "../../components/PdfResponse";
import dynamic from "next/dynamic";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DownloadIcon from "@mui/icons-material/Download";
import LoginModal from "@/components/LoginModal";
import ListIcon from "@mui/icons-material/List";
import HomeIcon from "@mui/icons-material/Home";
import InclusiveLearningLogo from "@/components/InclusiveLearningLogo";
import { set } from "zod";

const FileViewer = dynamic(() => import("react-file-viewer"), { ssr: false }) as any;

// --- Centralized API call helper for 401 handling ---
async function apiCallWith401<T>(
  apiCall: () => Promise<T>,
  on401: () => void
): Promise<T | undefined> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (
      (error?.response && error.response.status === 401) ||
      error?.status === 401 ||
      error?.status === 400
    ) {
      localStorage.removeItem("token");
      on401();
      return;
    }
    throw error;
  }
}

function SessionPageContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generateTextResponse, setGenerateTextResponse] = useState("");
  const [configResponse, setConfigResponse] = useState<{[key: string]: string}>({});
  const [generateJsonResponse, setGenerateJsonResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generateStep, setGenerateStep] = useState(0);
  const [nextQuestion, setNextQuestion] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    { question: string; userMessage: string; aiResponse?: string }[]
  >([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [configStep, setConfigStep] = useState(0);
  const [configFields, setConfigFields] = useState<{[key: string]: any}>({
    subject: "",
    lessonTopic: "",
    level: "",
    numStudents: "",
    studentType: [{ type: "", percentage: "" }],
    studyPeriod: "",
    limitation: "",
  });
  const [showResponse, setShowResponse] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [fileViewError, setFileViewError] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean | string>(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [errorWarning, setErrorWarning] = useState(false);
  const [fileViewerKey, setFileViewerKey] = useState(0);
  const fileViewerContainerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

// Centralized fetchSession using apiCallWith401
  const fetchSession = (sessionId?: string | null) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoginModalOpen(true);
      return;
    }
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUserId(decodedToken.userId);

      apiCallWith401(
        async () => {
          const res = await axios.post(
            "/api/session",
            { sessionId: sessionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = res.data;
          if (data.docxBuffer) {
            setModalOpen(false);
            const buffer = Buffer.from(data.docxBuffer, "base64");
            const url = URL.createObjectURL(
              new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              })
            );
            await setDocxUrl(null);
            console.log("Setting DOCX URL:", url);
            await setDocxUrl(url);
            setFileViewerKey((prev) => prev + 1);
          } else {
            setDocxUrl(null);
            setModalOpen(true);
            if (!data.configStep) {
              setConfigStep(0);
              setShowResponse(false);
            } else {
              setConfigStep(data.configStep - 1 ?? 0);
              if (data.configResponse) {
                setConfigResponse(data.configResponse || {});
                setShowResponse(true);
              }
            }
          }
        },
        () => setLoginModalOpen(true)
      );
    } catch (error) {
      localStorage.removeItem("token");
      setLoginModalOpen(true);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      localStorage.setItem("selectedSessionId", selectedSessionId);
    } else {
      localStorage.removeItem("selectedSessionId");
    }
  }, [selectedSessionId]);

  useEffect(() => {
    // Check for action parameter
    const action = searchParams.get('action');
    
    if (selectedSessionId) {
      setLoginModalOpen(false);
      fetchSession(selectedSessionId);
    } else {
      // If action is register, set modal to register mode
      if (action === 'register') {
        setLoginModalOpen('register');
      } else {
        setLoginModalOpen("session");
      }
    }
    // eslint-disable-next-line
  }, [router, searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoginModalOpen(true);
  };

  const handleHomeNavigation = () => {
    router.push("/");
  };

  const handleConfigNextStep = async () => {
    console.log("Advancing to next step:", configStep);
    // Move to next step and show input fields
    if (!showResponse) return;
    
    const nextStep = configStep + 1;
    console.log("Moving from configStep:", configStep, "to:", nextStep);
    
    // Update the database with the new step
    try {
      const token = localStorage.getItem("auth-token");
      const sessionId = localStorage.getItem("session-id");
      
      if (token && sessionId) {
        const updateResponse = await fetch("/api/session", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId: sessionId,
            configStep: nextStep
          })
        });

        if (!updateResponse.ok) {
          console.error("Failed to update step in database");
        } else {
          console.log("Successfully updated configStep to", nextStep, "in database");
        }
      }
    } catch (error) {
      console.error("Error updating step:", error);
    }
    
    // Simply move to next step and hide response to show input fields
    setConfigStep(nextStep);
    setShowResponse(false);
    setConfigResponse({});
  };

  const handleConfigFieldChange = (field: string, value: any) => {
    setShowResponse(false);
    setConfigResponse({});
    if (field === "studentType") {
      setConfigFields((prev) => ({
        ...prev,
        studentType: value,
      }));
    } else {
      setConfigFields((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleConfigStepSubmit = async () => {
    console.log("Submitting config step:", configStep);
    setLoading(true);
    await apiCallWith401(
      async () => {
        const token = localStorage.getItem("token");
        
        // For step 0: get curriculum + objectives combined
        // For step 1: get lesson plan + evaluation combined
        const endpoint = configStep === 0 
          ? `/api/chat/step/0` 
          : `/api/chat/step/1`;
        
        const res = await axios.post(
          endpoint,
          { ...configFields, sessionId: selectedSessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = res.data;
        setConfigResponse(data.responses || {});
        setShowResponse(true);
      },
      () => setLoginModalOpen(true)
    ).catch((error) => {
      if (error?.response && error.response.status === 404) {
        setErrorWarning(true);
        setShowResponse(false);
      } else {
        console.error("Error advancing step:", error);
      }
    });
    setLoading(false);
  };

  const handleConfigPreviousStep = async () => {
    // If previous step has no input fields, just go back a step

    if (showResponse) {
      setShowResponse(false);
      setConfigResponse({});
    } else {
      setLoading(true);
      await apiCallWith401(
        async () => {
          setConfigStep((prev) => Math.max(prev - 1, 0));
          const token = localStorage.getItem("token");
          const res = await axios.post(
            "/api/session",
            { sessionId: selectedSessionId, configStep: configStep },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = res.data;
          setConfigResponse(data.configResponse || {});
          setShowResponse(true);
        },
        () => setLoginModalOpen(true)
      );
      setLoading(false);
    }
  };

  const handleModalSubmit = async () => {
    setLoading(true);

    await apiCallWith401(
      async () => {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "/api/generate",
          { ...configFields, userId, sessionId: selectedSessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: "arraybuffer",
          }
        );

        const contentType = res.headers["content-type"];
        if (
          contentType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          const url = URL.createObjectURL(blob);
          setDocxUrl(url);
          setPdfUrl(null);
          setGenerateJsonResponse(null);
        } else if (contentType === "application/pdf") {
          const blob = new Blob([res.data], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setDocxUrl(null);
          setGenerateJsonResponse(null);
        } else {
          const text = new TextDecoder().decode(res.data);
          const data = JSON.parse(text);

          if (data.type === "json") {
            setGenerateJsonResponse(data.lessonPlan || data.improvedLessonPlan);
            setPdfUrl(null);
            setDocxUrl(null);
          } else if (data.type === "text") {
            setGenerateTextResponse(
              data.nextQuestion || "No further questions."
            );
            setPdfUrl(null);
            setDocxUrl(null);
            setGenerateJsonResponse(null);
          }
        }

        // Save reflection if present (last step)
        if (
          configFields.reflection1 ||
          configFields.reflection2 ||
          configFields.reflection3 ||
          configFields.reflection4 ||
          configFields.reflection5
        ) {
          await apiCallWith401(
            async () => {
              await axios.post(
                "/api/session/reflection",
                {
                  sessionId: selectedSessionId,
                  reflection: {
                    reflection1: configFields.reflection1,
                    reflection2: configFields.reflection2,
                    reflection3: configFields.reflection3,
                    reflection4: configFields.reflection4,
                    reflection5: configFields.reflection5,
                  },
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
            },
            () => setLoginModalOpen(true)
          );
        }

        setModalOpen(false);
      },
      () => setLoginModalOpen(true)
    );

    setLoading(false);
  };

  const handleClearSession = async () => {
    await apiCallWith401(
      async () => {
        const token = localStorage.getItem("token");
        await axios.post(
          "/api/auth/clear_session",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("Session cleared successfully!");
        window.location.reload();
      },
      () => setLoginModalOpen(true)
    );
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
    console.log("🎯 FEEDBACK SUBMISSION TRIGGERED - Step:", configStep);
    console.log("🎯 Feedback Data:", feedbackData);
    console.log("🎯 Selected Session ID:", selectedSessionId);
    setLoading(true);
    
    // For step 1, submit feedback then proceed to final generation
    if (configStep === 1) {
      console.log("🎯 Attempting to submit feedback to API...");
      try {
        await apiCallWith401(
          async () => {
            const token = localStorage.getItem("token");
            console.log("🎯 Token available:", !!token);
            
            // Save structured feedback for fine-tuning
            // Server will retrieve all session data using selectedSessionId
            const response = await axios.post(
              "/api/feedback/finetune",
              {
                sessionId: selectedSessionId,
                feedbackData
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            
            console.log("🎯 Feedback API Response:", response.data);
          },
          () => {
            console.log("🎯 Authentication failed during feedback submission");
            setLoginModalOpen(true);
          }
        );
        console.log("🎯 Feedback submission completed successfully");
      } catch (error) {
        console.error("🎯 Error during feedback submission:", error);
      }
    } else {
      console.log("🎯 Skipping feedback submission - not on step 1 (current step:", configStep, ")");
    }
    
    // After step 1 feedback, we're done with steps - ready for final generation
    console.log("🎯 Feedback submitted for step:", configStep);
    setLoading(false);
  };

  // Detect iframe load inside FileViewer
  useEffect(() => {
    if (!docxUrl || !fileViewerContainerRef.current) return;
    const iframe = fileViewerContainerRef.current.querySelector("iframe");
    if (iframe) {
      const handleLoad = () => setLoading(false);
      iframe.addEventListener("load", handleLoad);
      return () => {
        iframe.removeEventListener("load", handleLoad);
      };
    }
  }, [docxUrl, fileViewerKey]);

  return (
    <Container maxWidth="md">
      {/* Page-level loading backdrop (shows only if both modals are closed) */}
      <Backdrop
        open={loading && !modalOpen && !loginModalOpen}
        sx={{
          color: "#f0fdf4",
          zIndex: (theme) => theme.zIndex.drawer + 2,
          background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.4), rgba(16, 185, 129, 0.3))',
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "fixed",
          flexDirection: "column",
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '4px solid rgba(34, 197, 94, 0.3)',
            borderTop: '4px solid #22c55e',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: "#f0fdf4",
            textAlign: 'center',
            fontWeight: 400,
            letterSpacing: 0.5,
            textShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
          }}
        >
          กำลังโหลดเอกสาร...
        </Typography>
      </Backdrop>

      <LoginModal
        open={!!loginModalOpen}
        forceSessionStep={loginModalOpen === "session"}
        forceRegister={loginModalOpen === "register"}
        onLoginSuccess={(sessionId) => {
          setLoading(true);
          console.log("Login successful, sessionId:", sessionId);
          setLoginModalOpen(false);
          setSelectedSessionId(sessionId);
          fetchSession(sessionId);
          setLoading(false);
          
          // Clear URL parameters after successful login
          if (searchParams.get('action')) {
            router.replace('/session');
          }
        }}
      />

      <Box
        sx={{
          filter: loginModalOpen ? "blur(6px)" : "none",
          pointerEvents: loginModalOpen ? "none" : "auto",
          transition: "filter 0.3s",
        }}
      >
        <Box
          sx={{
            background: "rgba(21, 128, 61, 0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(34, 197, 94, 0.18)",
            boxShadow: "0 8px 32px 0 rgba(21, 128, 61, 0.2)",
            borderRadius: 3,
            p: 3,
            mb: 3,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0 12px 40px 0 rgba(21, 128, 61, 0.3)",
              transform: "translateY(-2px)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
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
                  fontSize: 40, 
                  color: "#22c55e", 
                  mr: 2,
                  filter: "drop-shadow(0 2px 8px rgba(21, 128, 61, 0.3))"
                }} 
              />
              <Typography variant="h4" className="brand-title" sx={{ 
                color: "#f0fdf4",
                fontWeight: 700,
                textShadow: "0 2px 8px rgba(21, 128, 61, 0.3)",
              }}>
                Inclusive Learning - Session
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(240, 253, 244, 0.6)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "0.8rem",
                }}
              >
                by Prof.Dr.Jaitip Na Songkhla and Thitanat Na Songkhla
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<HomeIcon />}
                onClick={handleHomeNavigation}
                sx={{ 
                  minWidth: 0, 
                  px: 1.5,
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
                หน้าหลัก
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ 
                  minWidth: 0, 
                  px: 1.5,
                  background: "rgba(239, 68, 68, 0.2)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fecaca",
                  "&:hover": {
                    background: "rgba(239, 68, 68, 0.3)",
                    borderColor: "rgba(239, 68, 68, 0.5)",
                    boxShadow: "0 8px 25px 0 rgba(239, 68, 68, 0.4)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                ออกจากระบบ
              </Button>
              {/* Session Selection Button */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<ListIcon />}
                onClick={() => setLoginModalOpen("session")}
                sx={{ 
                  minWidth: 0, 
                  px: 1.5,
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
                แผนการสอนของคุณ
              </Button>
            </Box>
          </Box>
        </Box>

        <ConfigModal
          open={modalOpen}
          loading={loading}
          configStep={configStep}
          configFields={configFields}
          responses={configResponse}
          showResponse={showResponse}
          onClose={() => setModalOpen(false)}
          onChange={handleConfigFieldChange}
          onStepSubmit={handleConfigStepSubmit}
          onSubmit={handleModalSubmit}
          onNextStep={handleConfigNextStep}
          onPreviousStep={handleConfigPreviousStep}
          onSectionSelection={() => setLoginModalOpen("session")}
          onFeedbackSubmit={handleFeedbackSubmit}
          onError={() => setShowResponse(false)}
          errorWarning={errorWarning}
          onClearErrorWarning={() => {
            setErrorWarning(false);
            setShowResponse(false);
          }}
        />

        <Box
          sx={{
            background: "rgba(21, 128, 61, 0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(34, 197, 94, 0.18)",
            boxShadow: "0 8px 32px 0 rgba(21, 128, 61, 0.2)",
            borderRadius: 3,
            p: 3,
            mb: 3,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0 12px 40px 0 rgba(21, 128, 61, 0.3)",
              transform: "translateY(-2px)",
            },
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={20}>
              {docxUrl ? (
                <>
                  {/* Download button always on top */}
                  <Button
                    variant="contained"
                    href={docxUrl}
                    download="curriculum.docx"
                    startIcon={<DownloadIcon />}
                    sx={{ 
                      mb: 2,
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
                    Download Curriculum (.docx)
                  </Button>
                  <Typography variant="body1" gutterBottom sx={{ color: "#dcfce7", mb: 2 }}>
                    เอกสารอาจแสดงผลไม่ถูกต้องบนเบราว์เซอร์ กรุณากด "Download
                    Curriculum (.docx)" เพื่อดาวน์โหลดเอกสารและเปิดด้วยโปรแกรม
                    Microsoft Word หรือ LibreOffice
                  </Typography>
                  {!fileViewError ? (
                    <div
                      ref={fileViewerContainerRef}
                      style={{
                        width: "100%",
                        height: "80vh",
                        overflow: "auto",
                        background: "rgba(6, 44, 32, 0.9)",
                        border: "2px solid rgba(34, 197, 94, 0.4)",
                        borderRadius: "12px",
                        padding: "16px",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: "0 8px 32px 0 rgba(6, 44, 32, 0.4)",
                        color: "black",
                      }}
                    >
                      <FileViewer
                        key={fileViewerKey}
                        fileType="docx"
                        filePath={docxUrl}
                        onError={() => {
                          setFileViewError(true);
                          setLoading(false);
                        }}
                      />
                    </div>
                  ) : (
                    <Typography 
                      sx={{ 
                        mt: 2, 
                        color: "#dcfce7",
                        textAlign: "center",
                        p: 3,
                        background: "rgba(6, 44, 32, 0.9)",
                        borderRadius: 3,
                        border: "2px solid rgba(34, 197, 94, 0.3)",
                      }}
                    >
                      Unable to preview DOCX. Please download the file.
                    </Typography>
                  )}
                </>
              ) : pdfUrl ? (
                <PdfResponse pdfUrl={pdfUrl} />
              ) : (
                <Typography sx={{ color: "#dcfce7" }}>No document available.</Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}

// Loading component for Suspense fallback
function SessionPageLoading() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '4px solid rgba(34, 197, 94, 0.3)',
            borderTop: '4px solid #22c55e',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: "#f0fdf4",
            textAlign: 'center',
            fontWeight: 400,
            letterSpacing: 0.5,
          }}
        >
          กำลังโหลด...
        </Typography>
      </Box>
    </Container>
  );
}

// Main export with Suspense wrapper
export default function SessionPage() {
  return (
    <Suspense fallback={<SessionPageLoading />}>
      <SessionPageContent />
    </Suspense>
  );
}
