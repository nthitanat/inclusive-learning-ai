"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Avatar,
  IconButton,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SchoolIcon from "@mui/icons-material/School";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GroupIcon from "@mui/icons-material/Group";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StarIcon from "@mui/icons-material/Star";
import InclusiveLearningLogo from "@/components/InclusiveLearningLogo";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      // Check if token is valid
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        if (decodedToken.exp > Date.now() / 1000) {
          // Token is valid, redirect to session page
          router.push("/session");
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
  }, [router]);

  const handleGetStarted = () => {
    router.push("/session");
  };

  const handleRegister = () => {
    router.push("/session?action=register");
  };

  const features = [
    {
      icon: <SmartToyIcon sx={{ fontSize: 40, color: "#22c55e" }} />,
      title: "AI-Powered Lesson Planning",
      description: "สร้างแผนการสอนที่ปรับแต่งได้ด้วยปัญญาประดิษฐ์ที่เข้าใจความต้องการของนักเรียนแต่ละคน"
    },
    {
      icon: <AccessibilityNewIcon sx={{ fontSize: 40, color: "#22c55e" }} />,
      title: "Inclusive Learning Design",
      description: "ออกแบบการเรียนการสอนที่รองรับนักเรียนทุกกลุ่ม ทุกความสามารถ และทุกรูปแบบการเรียนรู้"
    },
    {
      icon: <MenuBookIcon sx={{ fontSize: 40, color: "#22c55e" }} />,
      title: "Customizable Curriculum",
      description: "สร้างหลักสูตรที่ยืดหยุ่น ปรับแต่งได้ตามบริบทของห้องเรียนและความต้องการของนักเรียน"
    },
    {
      icon: <GroupIcon sx={{ fontSize: 40, color: "#22c55e" }} />,
      title: "Collaborative Platform",
      description: "แพลตฟอร์มที่ส่งเสริมการทำงานร่วมกันระหว่างครูและนักเรียนในการพัฒนาการเรียนรู้"
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: "#22c55e" }} />,
      title: "Progress Tracking",
      description: "ติดตามความก้าวหน้าและประเมินผลการเรียนรู้แบบต่อเนื่อง พร้อมข้อมูลเชิงลึก"
    },
    {
      icon: <StarIcon sx={{ fontSize: 40, color: "#22c55e" }} />,
      title: "Quality Assurance",
      description: "มั่นใจในคุณภาพการศึกษาด้วยระบบประกันคุณภาพที่ครอบคลุมทุกมิติของการเรียนรู้"
    }
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background with glassmorphism overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(21, 128, 61, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: -1,
        }}
      />

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Header Section */}
        <Box
          sx={{
            textAlign: "center",
            mb: 8,
            background: "rgba(21, 128, 61, 0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(34, 197, 94, 0.18)",
            boxShadow: "0 8px 32px 0 rgba(21, 128, 61, 0.2)",
            borderRadius: 4,
            p: 6,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0 12px 40px 0 rgba(21, 128, 61, 0.3)",
              transform: "translateY(-4px)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                mr: 3,
                width: 100,
                height: 100,
                borderRadius: "50%",
                border: "2px solid rgba(34, 197, 94, 0.3)",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "8px",
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
                  // Fallback to a placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(34, 197, 94, 0.2); color: #22c55e; font-weight: bold; font-size: 12px; text-align: center;">CU<br/>LOGO</div>';
                }}
              />
            </Box>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(21, 128, 61, 0.3) 100%)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "2px solid rgba(34, 197, 94, 0.3)",
                mr: 4,
                boxShadow: "0 8px 25px 0 rgba(34, 197, 94, 0.3)",
              }}
            >
              <InclusiveLearningLogo sx={{ fontSize: 60, color: "#22c55e" }} />
            </Avatar>
            <Box sx={{ textAlign: "left" }}>
              <Typography
                variant="h2"
                className="brand-title"
                sx={{
                  color: "#f0fdf4",
                  fontWeight: 800,
                  textShadow: "0 4px 12px rgba(21, 128, 61, 0.5)",
                  background: "linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  mb: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                Inclusive Learning AI
              </Typography>
              <Typography
                variant="h6"
                className="brand-subtitle"
                sx={{
                  color: "rgba(240, 253, 244, 0.8)",
                  fontWeight: 300,
                  letterSpacing: 1.2,
                }}
              >
                แพลตฟอร์มการศึกษาที่เท่าเทียมสำหรับทุกคน
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(240, 253, 244, 0.7)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  mt: 1,
                }}
              >
                by Prof.Dr.Jaitip Na Songkhla and Thitanat Na Songkhla
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="h5"
            className="brand-subtitle"
            sx={{
              color: "#dcfce7",
              mb: 4,
              maxWidth: 800,
              mx: "auto",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            ปฏิวัติการสอนด้วยปัญญาประดิษฐ์ที่เข้าใจความแตกต่างของนักเรียนแต่ละคน 
            สร้างแผนการเรียนรู้ที่ครอบคลุม เข้าถึงได้ และมีประสิทธิภาพ
          </Typography>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleGetStarted}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                background: "rgba(34, 197, 94, 0.2)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#f0fdf4",
                fontWeight: 600,
                borderRadius: 3,
                "&:hover": {
                  background: "rgba(34, 197, 94, 0.3)",
                  borderColor: "rgba(34, 197, 94, 0.5)",
                  boxShadow: "0 8px 25px 0 rgba(34, 197, 94, 0.4)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              เริ่มต้นใช้งาน
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={handleRegister}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                background: "rgba(240, 253, 244, 0.1)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#bbf7d0",
                fontWeight: 600,
                borderRadius: 3,
                "&:hover": {
                  background: "rgba(240, 253, 244, 0.15)",
                  borderColor: "rgba(34, 197, 94, 0.5)",
                  boxShadow: "0 8px 25px 0 rgba(34, 197, 94, 0.3)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              สมัครสมาชิก
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Typography
          variant="h3"
          className="brand-title"
          sx={{
            textAlign: "center",
            color: "#f0fdf4",
            fontWeight: 700,
            mb: 6,
            textShadow: "0 2px 8px rgba(21, 128, 61, 0.3)",
          }}
        >
          คุณสมบัติเด่น
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  background: "rgba(21, 128, 61, 0.08)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(34, 197, 94, 0.18)",
                  boxShadow: "0 8px 32px 0 rgba(21, 128, 61, 0.2)",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 12px 40px 0 rgba(21, 128, 61, 0.3)",
                    transform: "translateY(-8px)",
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    className="brand-title"
                    sx={{
                      color: "#f0fdf4",
                      fontWeight: 600,
                      mb: 2,
                      textShadow: "0 1px 4px rgba(21, 128, 61, 0.3)",
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    className="brand-subtitle"
                    sx={{
                      color: "#dcfce7",
                      lineHeight: 1.6,
                      fontSize: "1rem",
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Call to Action Section */}
        <Box
          sx={{
            textAlign: "center",
            mt: 10,
            background: "rgba(21, 128, 61, 0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(34, 197, 94, 0.18)",
            boxShadow: "0 8px 32px 0 rgba(21, 128, 61, 0.2)",
            borderRadius: 4,
            p: 6,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0 12px 40px 0 rgba(21, 128, 61, 0.3)",
              transform: "translateY(-4px)",
            },
          }}
        >
          <Typography
            variant="h4"
            className="brand-title"
            sx={{
              color: "#f0fdf4",
              fontWeight: 700,
              mb: 3,
              textShadow: "0 2px 8px rgba(21, 128, 61, 0.3)",
            }}
          >
            พร้อมเริ่มต้นแล้วใช่ไหม?
          </Typography>
          
          <Typography
            variant="h6"
            className="brand-subtitle"
            sx={{
              color: "#dcfce7",
              mb: 4,
              maxWidth: 600,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            เข้าร่วมกับครูและนักการศึกษาหลายพันคนที่กำลังใช้ Inclusive Learning AI 
            ในการสร้างประสบการณ์การเรียนรู้ที่ดีกว่า
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<SchoolIcon />}
            onClick={handleGetStarted}
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.2rem",
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(21, 128, 61, 0.4) 100%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              color: "#f0fdf4",
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: "0 8px 25px 0 rgba(34, 197, 94, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(21, 128, 61, 0.5) 100%)",
                borderColor: "rgba(34, 197, 94, 0.6)",
                boxShadow: "0 12px 35px 0 rgba(34, 197, 94, 0.5)",
                transform: "translateY(-3px)",
              },
            }}
          >
            เริ่มสร้างแผนการสอน
          </Button>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            textAlign: "center",
            mt: 8,
            pt: 4,
            borderTop: "1px solid rgba(34, 197, 94, 0.2)",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "rgba(240, 253, 244, 0.8)",
              fontSize: "0.95rem",
              mb: 1,
            }}
          >
            Created by Jaitip Na Songkhla and Thitanat Na Songkhla
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(240, 253, 244, 0.6)",
              fontSize: "0.9rem",
            }}
          >
            © 2025 Inclusive Learning AI. สร้างด้วยความใส่ใจในการศึกษาที่เท่าเทียม
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
