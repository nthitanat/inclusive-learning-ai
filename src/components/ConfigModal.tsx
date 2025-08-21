import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Backdrop,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import JsonDynamicRenderer from "./JsonDynamicRenderer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ListIcon from "@mui/icons-material/List";
import LineQROpenModal from "./LineQROpenModal";
import LineIcon from "./LineIcon";

interface ConfigModalProps {
  open: boolean;
  loading: boolean;
  configStep: number;
  configFields: { [key: string]: string };
  response: string;
  showResponse: boolean;
  onClose: () => void;
  onChange: (field: string, value: string) => void;
  onStepSubmit: () => void;
  onSubmit: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onSectionSelection?: () => void;
  onFeedbackSubmit: (feedbackData: any) => void; // Updated to accept structured feedback
  onError?: (msg: string) => void;
  errorWarning?: boolean;
  onClearErrorWarning?: () => void;
}

// Rating-based Feedback Component
const RatingFeedbackComponent: React.FC<{
  step: number;
  onFeedbackChange: (feedback: any) => void;
}> = ({ step, onFeedbackChange }) => {
  const [ratings, setRatings] = useState<{[key: string]: {[key: string]: number}}>({});
  const [openComment, setOpenComment] = useState("");

  const currentFields = step === 2 ? feedbackRatingFields.step2 : 
                       step === 3 ? feedbackRatingFields.step3 : [];

  const handleRatingChange = (category: string, questionKey: string, value: number) => {
    const newRatings = {
      ...ratings,
      [category]: {
        ...ratings[category],
        [questionKey]: value
      }
    };
    setRatings(newRatings);
    
    // Send structured feedback data
    onFeedbackChange({
      step: step,
      ratings: newRatings,
      openComment: openComment,
      timestamp: new Date().toISOString()
    });
  };

  const handleCommentChange = (value: string) => {
    setOpenComment(value);
    onFeedbackChange({
      step: step,
      ratings: ratings,
      openComment: value,
      timestamp: new Date().toISOString()
    });
  };

  if (currentFields.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: "#f0fdf4", 
          mb: 2,
          fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" }
        }}
      >
        📊 ประเมินคุณภาพการตอบของ AI - ส่วนที่ {step + 1}
      </Typography>
      
      {currentFields.map((category, categoryIdx) => (
        <Accordion key={category.category} sx={{
          background: "rgba(240, 253, 244, 0.05)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          mb: 1,
          "&:before": { display: "none" }
        }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#bbf7d0" }} />}>
            <Typography sx={{ color: "#dcfce7", fontWeight: 500 }}>
              {category.label}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {category.questions.map((question) => (
              <Box key={question.key} sx={{ mb: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: "#bbf7d0", 
                    mb: 1,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" }
                  }}
                >
                  {question.label}
                </Typography>
                <Box 
                  sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: { xs: 1, sm: 2 },
                    flexWrap: { xs: "wrap", sm: "nowrap" }
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#9ca3af",
                      fontSize: { xs: "0.7rem", sm: "0.75rem" }
                    }}
                  >
                    ไม่ดี
                  </Typography>
                  <Rating
                    value={ratings[category.category]?.[question.key] || 0}
                    onChange={(_, value) => handleRatingChange(category.category, question.key, value || 0)}
                    max={question.scale}
                    size={window.innerWidth < 600 ? "small" : "medium"}
                    sx={{
                      "& .MuiRating-iconFilled": {
                        color: "#22c55e",
                      },
                      "& .MuiRating-iconEmpty": {
                        color: "rgba(34, 197, 94, 0.3)",
                      },
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#9ca3af",
                      fontSize: { xs: "0.7rem", sm: "0.75rem" }
                    }}
                  >
                    ดีมาก
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "#22c55e", 
                      fontWeight: 500,
                      fontSize: { xs: "0.8rem", sm: "0.875rem" }
                    }}
                  >
                    {ratings[category.category]?.[question.key] || 0}/{question.scale}
                  </Typography>
                </Box>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      <TextField
        fullWidth
        label="ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)"
        value={openComment}
        onChange={(e) => handleCommentChange(e.target.value)}
        margin="normal"
        multiline
        minRows={2}
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
            "& textarea": {
              color: "#f0fdf4",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#bbf7d0",
          },
        }}
      />
    </Box>
  );
};

export const stepConfigFields = [
  [
    { label: "กลุ่มสาระ", field: "subject" },
    { label: "เรื่อง", field: "lessonTopic" },
    { label: "ระดับชั้น", field: "level" },
  ],
  [],
  [
    { label: "จำนวนนักเรียนในชั้น", field: "numStudents" },
    { label: "นักเรียนที่มีความแตกต่าง", field: "studentType" },
    { label: "จำนวนคาบ", field: "studyPeriod" },
  ],
  [],
];

// Focused feedback only for Steps 2 & 3
export const feedbackRatingFields = {
  step2: [
    {
      category: "udl_implementation",
      label: "การใช้หลัก UDL (Multiple Means of Representation, Engagement, Action/Expression)",
      questions: [
        { key: "representation", label: "ความหลากหลายของการนำเสนอเนื้อหา", scale: 5 },
        { key: "engagement", label: "กลยุทธ์สร้างแรงจูงใจสำหรับนักเรียนแต่ละประเภท", scale: 5 },
        { key: "action_expression", label: "ทางเลือกในการแสดงออกและประเมินผล", scale: 5 }
      ]
    },
    {
      category: "differentiation_quality",
      label: "คุณภาพการปรับการเรียนการสอนตามความแตกต่างของผู้เรียน",
      questions: [
        { key: "appropriateness", label: "ความเหมาะสมของการปรับกิจกรรม", scale: 5 },
        { key: "feasibility", label: "ความเป็นไปได้ในการดำเนินการจริง", scale: 5 },
        { key: "specificity", label: "ความชัดเจนของคำแนะนำการปรับ", scale: 5 }
      ]
    },
    {
      category: "cognitive_complexity",
      label: "ความซับซ้อนและระดับการคิดของกิจกรรม",
      questions: [
        { key: "complexity_level", label: "ระดับความท้าทายเหมาะสมกับผู้เรียน", scale: 5 },
        { key: "higher_order", label: "ส่งเสริมการคิดขั้นสูง (วิเคราะห์/สร้างสรรค์)", scale: 5 }
      ]
    },
    {
      category: "practical_implementation",
      label: "ความเป็นไปได้ในการนำไปใช้จริง",
      questions: [
        { key: "time_allocation", label: "การกำหนดเวลาแต่ละกิจกรรม", scale: 5 },
        { key: "resource_availability", label: "ความพร้อมของสื่อและอุปกรณ์", scale: 5 },
        { key: "classroom_management", label: "การจัดการชั้นเรียน", scale: 5 }
      ]
    }
  ],
  step3: [
    {
      category: "assessment_alignment",
      label: "ความสอดคล้องของการประเมิน",
      questions: [
        { key: "objective_alignment", label: "สอดคล้องกับจุดประสงค์การเรียนรู้", scale: 5 },
        { key: "curriculum_standards", label: "สอดคล้องกับมาตรฐานหลักสูตร", scale: 5 },
        { key: "comprehensive_coverage", label: "ครอบคลุมทุกด้านการเรียนรู้", scale: 5 }
      ]
    },
    {
      category: "assessment_inclusivity",
      label: "ความครอบคลุมและเป็นธรรมของการประเมิน",
      questions: [
        { key: "multiple_methods", label: "ความหลากหลายของวิธีประเมิน", scale: 5 },
        { key: "accessibility", label: "เข้าถึงได้สำหรับนักเรียนทุกประเภท", scale: 5 },
        { key: "fair_scoring", label: "ความเป็นธรรมในเกณฑ์การให้คะแนน", scale: 5 }
      ]
    },
    {
      category: "evaluation_feasibility",
      label: "ความเป็นไปได้ในการประเมิน",
      questions: [
        { key: "teacher_workload", label: "ภาระงานของครูในการประเมิน", scale: 5 },
        { key: "scoring_clarity", label: "ความชัดเจนของเกณฑ์การประเมิน", scale: 5 },
        { key: "time_efficiency", label: "ประสิทธิภาพด้านเวลา", scale: 5 }
      ]
    }
  ]
};

const LOADING_SENTENCE =
  "กำลังประมวลผล เพื่อความรวดเร็ว แม่นยำ สำหรับ AI version นี้ กรุณาอย่าปิดหน้าจอ";

const TypingLoader: React.FC = () => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [dots, setDots] = useState("");
  const [idx, setIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (idx < LOADING_SENTENCE.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + LOADING_SENTENCE[idx]);
        setIdx(idx + 1);
      }, 35); // slightly faster typing speed
      return () => clearTimeout(timeout);
    } else {
      setDone(true);
    }
  }, [idx]);

  useEffect(() => {
    if (!done) return;
    let dotCount = 0;
    const interval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      setDots(".".repeat(dotCount));
    }, 350);
    return () => clearInterval(interval);
  }, [done]);

  useEffect(() => {
    // Cursor blinking animation
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reset when remount
    setDisplayed("");
    setDone(false);
    setDots("");
    setIdx(0);
    setCursorVisible(true);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {/* AI Brain Loading Icon */}
      <Box
        sx={{
          width: { xs: 60, sm: 80 },
          height: { xs: 60, sm: 80 },
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.3))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '2px solid rgba(34, 197, 94, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)',
            },
            '50%': {
              transform: 'scale(1.05)',
              boxShadow: '0 0 0 15px rgba(34, 197, 94, 0.1)',
            },
            '100%': {
              transform: 'scale(1)',
              boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)',
            },
          },
        }}
      >
        {/* Neural network dots */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            '& .neural-dot': {
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #10b981)',
              animation: 'neuralPulse 1.5s ease-in-out infinite',
            },
            '& .neural-dot:nth-of-type(1)': {
              top: '20%',
              left: '30%',
              animationDelay: '0s',
            },
            '& .neural-dot:nth-of-type(2)': {
              top: '30%',
              right: '25%',
              animationDelay: '0.3s',
            },
            '& .neural-dot:nth-of-type(3)': {
              bottom: '25%',
              left: '25%',
              animationDelay: '0.6s',
            },
            '& .neural-dot:nth-of-type(4)': {
              bottom: '30%',
              right: '30%',
              animationDelay: '0.9s',
            },
            '& .neural-dot:nth-of-type(5)': {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animationDelay: '1.2s',
            },
            '@keyframes neuralPulse': {
              '0%, 100%': {
                opacity: 0.4,
                transform: 'scale(0.8)',
              },
              '50%': {
                opacity: 1,
                transform: 'scale(1.2)',
              },
            },
          }}
        >
          <div className="neural-dot" />
          <div className="neural-dot" />
          <div className="neural-dot" />
          <div className="neural-dot" />
          <div className="neural-dot" />
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box
        sx={{
          width: { xs: 250, sm: 300 },
          height: 4,
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: '100%',
            background: 'linear-gradient(90deg, #22c55e, #10b981, #22c55e)',
            backgroundSize: '200% 100%',
            borderRadius: 2,
            animation: 'progressFlow 2s linear infinite',
            width: done ? '100%' : `${(idx / LOADING_SENTENCE.length) * 100}%`,
            transition: 'width 0.1s ease-out',
            '@keyframes progressFlow': {
              '0%': {
                backgroundPosition: '-200% 0',
              },
              '100%': {
                backgroundPosition: '200% 0',
              },
            },
          }}
        />
      </Box>

      {/* Typography with enhanced styling */}
      <Typography 
        variant="h6" 
        sx={{ 
          minHeight: 40, 
          color: "#f0fdf4",
          textAlign: 'center',
          fontWeight: 400,
          letterSpacing: 0.5,
          textShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
        }}
      >
        {displayed}
        {!done && (
          <span 
            style={{
              opacity: cursorVisible ? 1 : 0,
              transition: 'opacity 0.1s ease-in-out',
              color: '#22c55e',
              fontWeight: 'bold',
              marginLeft: '2px'
            }}
          >
            |
          </span>
        )}
        {done && (
          <span 
            style={{
              color: '#22c55e',
              fontWeight: 'bold',
              animation: 'dotBounce 0.35s ease-in-out infinite',
            }}
          >
            {dots}
          </span>
        )}
      </Typography>

      <style>
        {`
          @keyframes dotBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
        `}
      </style>
    </Box>
  );
};

const SUBJECT_OPTIONS = [
  "ภาษาไทย",
  "คณิตศาสตร์",
  "วิทยาศาสตร์",
  "สังคมศึกษา ศาสนาและวัฒนธรรม",
  "สุขศึกษาและพลศึกษา",
  "ศิลปะ",
  "การงานอาชีพและเทคโนโลยี",
  "ภาษาต่างประเทศ",
];

const INCLUSIVE_STUDENT_TYPES = [
  "นักเรียนที่มีความสามารถพิเศษ (Gifted)",
  "นักเรียนที่มีความต้องการพิเศษทางการเรียนรู้ (Learning Disabilities)",
  "นักเรียนที่มีความบกพร่องทางการมองเห็น",
  "นักเรียนที่มีความบกพร่องทางการได้ยิน",
  "นักเรียนที่มีความบกพร่องทางร่างกาย",
  "นักเรียนที่มีความบกพร่องทางสติปัญญา",
  "นักเรียนออทิสติก (Autism Spectrum Disorder)",
  "นักเรียน ADHD (สมาธิสั้น)",
  "นักเรียนที่มีปัญหาทางพฤติกรรม",
  "นักเรียนที่มีปัญหาทางอารมณ์",
  "นักเรียนที่มีความยากลำบากทางเศรษฐกิจ",
  "นักเรียนต่างชาติ/ต่างภาษา",
  "นักเรียนที่เรียนช้า (Slow Learner)",
  "นักเรียนที่มีปัญหาการอ่าน (Dyslexia)",
  "นักเรียนที่มีปัญหาการเขียน (Dysgraphia)",
  "นักเรียนที่มีปัญหาคณิตศาสตร์ (Dyscalculia)",
  "อื่นๆ (โปรดระบุ)",
];

const ConfigModal: React.FC<ConfigModalProps> = ({
  open,
  loading,
  configStep,
  configFields,
  response,
  showResponse,
  onClose,
  onChange,
  onStepSubmit,
  onSubmit,
  onNextStep,
  onPreviousStep,
  onSectionSelection,
  onFeedbackSubmit,
  onError,
  errorWarning,
  onClearErrorWarning,
}) => {
  const currentFields = stepConfigFields[configStep] || [
    { label: "Unknown Step", field: "" },
  ];
  const [structuredFeedback, setStructuredFeedback] = useState<any>(null);
  const [lineModalOpen, setLineModalOpen] = useState(false);

  useEffect(() => {
    // Reset structured feedback when step changes or modal opens
    setStructuredFeedback(null);
    // eslint-disable-next-line
  }, [configStep, showResponse, open]);

  const handleFeedbackChange = (feedbackData: any) => {
    setStructuredFeedback(feedbackData);
  };

  const shouldShowFeedback = showResponse && (configStep === 2 || configStep === 3);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: {
            xs: "95vw",
            sm: "90vw",
            md: "85vw",
            lg: "800px",
            xl: "800px"
          },
          height: {
            xs: "95vh",
            sm: "90vh",
            md: "85vh",
            lg: "600px",
            xl: "600px"
          },
          maxWidth: "800px",
          maxHeight: "90vh",
          background: "rgba(21, 128, 61, 0.12)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          boxShadow: "0 25px 50px -12px rgba(21, 128, 61, 0.5)",
          p: 0,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Loading Backdrop for ConfigModal only */}
        <Backdrop
          open={loading}
          sx={{
            color: "#f0fdf4",
            zIndex: (theme) => theme.zIndex.modal + 1,
            background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.4), rgba(16, 185, 129, 0.3))',
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            flexDirection: "column",
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TypingLoader />
        </Backdrop>
        {/* Header with buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid rgba(34, 197, 94, 0.15)",
            background: "rgba(240, 253, 244, 0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            minHeight: 64,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <Button
            startIcon={<ListIcon />}
            onClick={onSectionSelection}
            variant="outlined"
            size={window.innerWidth < 600 ? "small" : "medium"}
            sx={{ 
              ml: { xs: 0, sm: 1 },
              mb: { xs: 1, sm: 0 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
          <Button
            startIcon={<LineIcon />}
            onClick={() => setLineModalOpen(true)}
            color="success"
            variant="contained"
            size={window.innerWidth < 600 ? "small" : "medium"}
            sx={{ 
              ml: { xs: 0, sm: 1 }, 
              mb: { xs: 1, sm: 0 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              bgcolor: "#06C755", 
              "&:hover": { bgcolor: "#05b94a" } 
            }}
          >
            Line OA
          </Button>
        </Box>
        <LineQROpenModal open={lineModalOpen} onClose={() => setLineModalOpen(false)} />
        {/* Modal content */}
        <Box
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            pt: 2, 
            height: "calc(100% - 64px)", 
            overflowY: "auto" 
          }}
        >
          {/* 404 Error Page */}
          {errorWarning ? (
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <Typography variant="h4" color="error" gutterBottom>
                ไม่พบข้อมูลหลักสูตรที่เกี่ยวข้อง
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                กรุณาตรวจสอบข้อมูลที่กรอก หรือเลือกข้อมูลใหม่
              </Typography>
              <Typography variant="body1" color="warning" sx={{ mb: 3 }}>
                **ท่านอาจลองไม่ระบุ ชั้นเรียน
                เพื่อให้ AI ค้นหาข้อมูลหลักสูตรที่เกี่ยวข้องได้กว้างขึ้น**
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={onClearErrorWarning}
              >
                ย้อนกลับ
              </Button>
            </Box>
          ) : (
            <>
              {/* Step Title with custom typography for each step */}
              {(() => {
                switch (configStep) {
                  case 0:
                    return (
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          color: "#f0fdf4", 
                          fontWeight: 600,
                          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
                        }}
                      >
                        ส่วนที่ 1: ข้อมูลหลักสูตร
                      </Typography>
                    );
                  case 1:
                    return (
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          color: "#f0fdf4", 
                          fontWeight: 600,
                          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
                        }}
                      >
                        ส่วนที่ 2: จุดประสงค์การเรียนรู้
                      </Typography>
                    );
                  case 2:
                    return (
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          color: "#f0fdf4", 
                          fontWeight: 600,
                          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
                        }}
                      >
                        ส่วนที่ 3: กระบวนการจัดกิจกรรมการเรียนรู้
                      </Typography>
                    );
                  case 3:
                    return (
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          color: "#f0fdf4", 
                          fontWeight: 600,
                          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
                        }}
                      >
                        ส่วนที่ 4: การวัดประเมินผล
                      </Typography>
                    );
                  default:
                    return (
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          color: "#f0fdf4",
                          fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.375rem" }
                        }}
                      >
                        ส่วน {configStep + 1}:{" "}
                        {currentFields.length === 1
                          ? currentFields[0].label
                          : currentFields.length === 0
                          ? "กำลังประมวลผล..."
                          : "โปรดระบุข้อมูลสำหรับการออกแบบแผนการสอน"}
                      </Typography>
                    );
                }
              })()}

              {/* Show input fields only if response is not shown */}
              {!showResponse &&
                currentFields.length > 0 &&
                currentFields.map((fieldObj) =>
                  fieldObj.field === "studentType" ? (
                    <Box key="studentType" sx={{ mb: 2 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: "#dcfce7",
                          fontSize: { xs: "0.9rem", sm: "1rem" }
                        }}
                      >
                        ประเภทของนักเรียนที่มีความหลากหลาย
                      </Typography>
                      {Array.isArray(configFields.studentType) &&
                        configFields.studentType.map((student, idx) => (
                          <Box
                            key={idx}
                            sx={{ 
                              display: "flex", 
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 1, 
                              mb: 1 
                            }}
                          >
                            <FormControl fullWidth size="small" sx={{ mb: { xs: 1, sm: 0 } }}>
                              <InputLabel 
                                id={`student-type-${idx}-label`}
                                sx={{ color: "#bbf7d0" }}
                              >
                                ประเภท
                              </InputLabel>
                              <Select
                                labelId={`student-type-${idx}-label`}
                                value={student.type}
                                label="ประเภท"
                                onChange={(e) => {
                                  const updated = [...configFields.studentType];
                                  updated[idx].type = e.target.value;
                                  onChange("studentType", updated);
                                }}
                                sx={{
                                  background: "rgba(240, 253, 244, 0.1)",
                                  backdropFilter: "blur(8px)",
                                  WebkitBackdropFilter: "blur(8px)",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgba(34, 197, 94, 0.2)",
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgba(34, 197, 94, 0.4)",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgba(34, 197, 94, 0.6)",
                                  },
                                  "& .MuiSelect-select": {
                                    color: "#f0fdf4",
                                  },
                                  "& .MuiSvgIcon-root": {
                                    color: "#bbf7d0",
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      background: "rgba(21, 128, 61, 0.12)",
                                      backdropFilter: "blur(20px)",
                                      WebkitBackdropFilter: "blur(20px)",
                                      border: "1px solid rgba(34, 197, 94, 0.25)",
                                      maxHeight: 300,
                                      "& .MuiMenuItem-root": {
                                        color: "#f0fdf4",
                                        fontSize: "0.875rem",
                                        "&:hover": {
                                          background: "rgba(34, 197, 94, 0.15)",
                                        },
                                        "&.Mui-selected": {
                                          background: "rgba(34, 197, 94, 0.2)",
                                        },
                                      },
                                    },
                                  },
                                }}
                              >
                                {INCLUSIVE_STUDENT_TYPES.map((option) => (
                                  <MenuItem value={option} key={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <TextField
                              label="จำนวนร้อยละของชั้นเรียน"
                              value={student.percentage}
                              onChange={(e) => {
                                const updated = [...configFields.studentType];
                                updated[idx].percentage = e.target.value;
                                onChange("studentType", updated);
                              }}
                              size="small"
                              type="number"
                              fullWidth
                              InputProps={{ 
                                endAdornment: <span style={{ color: "#bbf7d0" }}>%</span>,
                              }}
                              sx={{
                                mb: { xs: 1, sm: 0 },
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
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                const updated = configFields.studentType.filter(
                                  (_: any, i: number) => i !== idx
                                );
                                onChange("studentType", updated);
                              }}
                              disabled={
                                configFields.studentType.length == 1 &&
                                !!showResponse
                              }
                              sx={{
                                minWidth: { xs: "auto", sm: "120px" },
                                background: "rgba(239, 68, 68, 0.15)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#fecaca",
                                "&:hover": {
                                  background: "rgba(239, 68, 68, 0.25)",
                                  borderColor: "rgba(239, 68, 68, 0.5)",
                                },
                              }}
                            >
                              ลบ
                            </Button>
                          </Box>
                        ))}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          onChange("studentType", [
                            ...configFields.studentType,
                            { type: "", percentage: "" },
                          ]);
                        }}
                        sx={{ 
                          mt: 1,
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
                        เพิ่มประเภทนักเรียน
                      </Button>
                    </Box>
                  ) : fieldObj.field === "subject" ? (
                    <FormControl fullWidth margin="normal" key={fieldObj.field}>
                      <InputLabel 
                        id="subject-select-label"
                        sx={{ color: "#bbf7d0" }}
                      >
                        {fieldObj.label}
                      </InputLabel>
                      <Select
                        labelId="subject-select-label"
                        value={configFields.subject || ""}
                        label={fieldObj.label}
                        onChange={(e) => onChange("subject", e.target.value)}
                        sx={{
                          background: "rgba(240, 253, 244, 0.1)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(34, 197, 94, 0.2)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(34, 197, 94, 0.4)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(34, 197, 94, 0.6)",
                          },
                          "& .MuiSelect-select": {
                            color: "#f0fdf4",
                          },
                          "& .MuiSvgIcon-root": {
                            color: "#bbf7d0",
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              background: "rgba(21, 128, 61, 0.12)",
                              backdropFilter: "blur(20px)",
                              WebkitBackdropFilter: "blur(20px)",
                              border: "1px solid rgba(34, 197, 94, 0.25)",
                              "& .MuiMenuItem-root": {
                                color: "#f0fdf4",
                                "&:hover": {
                                  background: "rgba(34, 197, 94, 0.15)",
                                },
                                "&.Mui-selected": {
                                  background: "rgba(34, 197, 94, 0.2)",
                                },
                              },
                            },
                          },
                        }}
                      >
                        {SUBJECT_OPTIONS.map((option) => (
                          <MenuItem value={option} key={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      key={fieldObj.field}
                      fullWidth
                      label={fieldObj.label}
                      value={
                        fieldObj.field ? configFields[fieldObj.field] || "" : ""
                      }
                      onChange={(e) => onChange(fieldObj.field, e.target.value)}
                      margin="normal"
                      type={
                        fieldObj.field === "numStudents" ||
                        fieldObj.field === "studyHours" ||
                        fieldObj.field === "timePerClass"
                          ? "number"
                          : "text"
                      }
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
                  )
                )}
              

              {/* Show response box only if response is shown */}
              {showResponse && response && (
                <Box
                  sx={{
                    mt: 2,
                    p: { xs: 1.5, sm: 2 },
                    background: "rgba(240, 253, 244, 0.08)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    boxShadow: "0 8px 32px 0 rgba(21, 128, 61, 0.15)",
                    borderRadius: 2,
                    height: shouldShowFeedback 
                      ? { xs: 200, sm: 220, md: 250 }
                      : { xs: 400, sm: 400, md: 400 },
                    maxHeight: shouldShowFeedback 
                      ? { xs: 200, sm: 220, md: 250 }
                      : { xs: 400, sm: 400, md: 400 },
                    minHeight: shouldShowFeedback 
                      ? { xs: 200, sm: 220, md: 250 }
                      : { xs: 400, sm: 400, md: 400 },
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  <JsonDynamicRenderer data={response} />
                </Box>
              )}

              {/* Rating-based Feedback for Steps 2 & 3 only */}
              {shouldShowFeedback && (
                <RatingFeedbackComponent
                  step={configStep}
                  onFeedbackChange={handleFeedbackChange}
                />
              )}

              <Box
                sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  mt: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 2, sm: 0 }
                }}
              >
                <Button
                  variant="outlined"
                  onClick={onPreviousStep}
                  disabled={configStep === 0 && !showResponse}
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  sx={{
                    order: { xs: 2, sm: 1 },
                    background: "rgba(156, 163, 175, 0.15)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(156, 163, 175, 0.3)",
                    color: "#d1d5db",
                    "&:hover": {
                      background: "rgba(156, 163, 175, 0.25)",
                      borderColor: "rgba(156, 163, 175, 0.5)",
                    },
                    "&:disabled": {
                      background: "rgba(156, 163, 175, 0.05)",
                      borderColor: "rgba(156, 163, 175, 0.1)",
                      color: "rgba(156, 163, 175, 0.4)",
                    },
                  }}
                >
                  กลับ
                </Button>
                {configStep === stepConfigFields.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={onSubmit}
                    disabled={loading}
                    size={window.innerWidth < 600 ? "small" : "medium"}
                    sx={{
                      order: { xs: 1, sm: 2 },
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
                      "&:disabled": {
                        background: "rgba(34, 197, 94, 0.1)",
                        borderColor: "rgba(34, 197, 94, 0.15)",
                        color: "rgba(34, 197, 94, 0.4)",
                      },
                    }}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                ) : !showResponse ? (
                  <Button
                    variant="contained"
                    onClick={onStepSubmit}
                    disabled={loading}
                    size={window.innerWidth < 600 ? "small" : "medium"}
                    sx={{
                      order: { xs: 1, sm: 2 },
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
                      "&:disabled": {
                        background: "rgba(34, 197, 94, 0.1)",
                        borderColor: "rgba(34, 197, 94, 0.15)",
                        color: "rgba(34, 197, 94, 0.4)",
                      },
                    }}
                  >
                    {loading ? "Loading..." : "ถัดไป"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => onFeedbackSubmit(structuredFeedback)}
                    disabled={loading || (shouldShowFeedback && !structuredFeedback)}
                    size={window.innerWidth < 600 ? "small" : "medium"}
                    sx={{
                      order: { xs: 1, sm: 2 },
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
                      "&:disabled": {
                        background: "rgba(34, 197, 94, 0.1)",
                        borderColor: "rgba(34, 197, 94, 0.15)",
                        color: "rgba(34, 197, 94, 0.4)",
                      },
                    }}
                  >
                    {shouldShowFeedback ? "ส่งความเห็นและถัดไป" : "ถัดไป"}
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfigModal; // Renamed
