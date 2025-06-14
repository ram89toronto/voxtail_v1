import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Upload, FileVideo, Settings, Crown, CheckCircle } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const steps = [
  {
    id: 1,
    title: "Welcome to VoxTailor",
    description: "Your AI-powered speech-to-text and video editing platform",
    icon: <CheckCircle className="h-8 w-8 text-green-500" />,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Transform Audio & Video with AI
          </h3>
          <p className="text-gray-600 mt-2">
            Convert speech to text, generate subtitles, and edit videos with professional-grade accuracy.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <Mic className="h-6 w-6 text-purple-600 mb-2" />
            <h4 className="font-semibold">Real-time Recording</h4>
            <p className="text-sm text-gray-600">Record directly in browser</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <Upload className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-semibold">File Upload</h4>
            <p className="text-sm text-gray-600">Support for MP3, MP4, WAV</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Quick Start",
    description: "Drag and drop files to begin transcription",
    icon: <Upload className="h-8 w-8 text-blue-500" />,
    content: (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Transcribing</h3>
          <p className="text-gray-600 mb-4">Drop files here or click to browse</p>
          <Button variant="outline">Browse Files</Button>
        </div>
        <div className="text-sm text-gray-500">
          <p><strong>Tip:</strong> For best results, use clear audio with minimal background noise.</p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Transcription & Editing",
    description: "AI converts speech to text with high accuracy",
    icon: <FileVideo className="h-8 w-8 text-green-500" />,
    content: (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">What you can do:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Generate accurate transcriptions
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Create SRT subtitle files
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Edit video timeline
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Export in multiple formats
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Choose Your Plan",
    description: "Select the plan that fits your needs",
    icon: <Crown className="h-8 w-8 text-yellow-500" />,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Free</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 60 minutes/month</li>
                <li>• Basic transcription</li>
                <li>• Standard quality</li>
                <li>• Community support</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-purple-600">Pro</Badge>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Unlimited minutes</li>
                <li>• Advanced AI models</li>
                <li>• HD video processing</li>
                <li>• Priority support</li>
                <li>• Batch processing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
];

export default function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const { updateSettings } = useSettings();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await updateSettings({ hasCompletedOnboarding: true });
      onComplete();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {currentStepData.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>

              <div className="mb-8">
                {currentStepData.content}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleComplete}>
                Skip Tutorial
              </Button>
              <Button onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-blue-600">
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}