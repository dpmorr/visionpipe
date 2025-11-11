import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, BookOpen, Check, Building2, Leaf, Beaker, Factory, Construction, Store, Hospital, Recycle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TrainingVideo {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnailUrl: string;
  videoUrl: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  industries: string[];
  author: {
    name: string;
    organization: string;
    organizationLogo: string;
    role: string;
  };
  quiz: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
  };
}

const industries = [
  "Manufacturing",
  "Construction",
  "Retail",
  "Healthcare",
  "Agriculture",
  "Technology",
  "Hospitality",
  "Transportation"
];

const trainingVideos: TrainingVideo[] = [
  {
    id: 1,
    title: "Introduction to Circular Economy Business Models",
    description: "Learn the fundamentals of circular economy and how businesses can transition from linear to circular models.",
    duration: "15:30",
    category: "Fundamentals",
    thumbnailUrl: "https://placehold.co/600x400/png",
    videoUrl: "https://example.com/video1",
    difficulty: "beginner",
    industries: ["Manufacturing", "Retail", "Construction", "Technology"],
    author: {
      name: "Dr. Sarah Chen",
      organization: "CSIRO",
      organizationLogo: "csiro",
      role: "Lead Researcher, Circular Economy"
    },
    quiz: {
      questions: [
        {
          question: "What is the main difference between linear and circular economy models?",
          options: [
            "Linear models focus on 'take-make-dispose' while circular models focus on regenerative design",
            "Linear models are cheaper to implement",
            "Circular models only work for large corporations",
            "There is no significant difference between them"
          ],
          correctAnswer: 0
        },
        {
          question: "Which of the following is a key principle of circular economy?",
          options: [
            "Maximize waste production",
            "Design out waste and pollution",
            "Increase resource consumption",
            "Focus on single-use products"
          ],
          correctAnswer: 1
        },
        {
          question: "How do circular business models create value?",
          options: [
            "By increasing production costs",
            "Through planned obsolescence",
            "By keeping products and materials in use",
            "By maximizing waste production"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: 2,
    title: "Implementing Product-as-a-Service",
    description: "Discover how to transform your product offerings into service-based business models.",
    duration: "22:45",
    category: "Business Models",
    thumbnailUrl: "https://placehold.co/600x400/png",
    videoUrl: "https://example.com/video2",
    difficulty: "intermediate",
    industries: ["Manufacturing", "Technology", "Transportation"],
    author: {
      name: "Michael Roberts",
      organization: "Planet Ark",
      organizationLogo: "planetark",
      role: "Head of Circular Economy Programs"
    },
    quiz: {
      questions: [
        {
          question: "What is the primary benefit of Product-as-a-Service models?",
          options: [
            "Higher upfront costs for customers",
            "Reduced customer engagement",
            "Ongoing revenue streams and stronger customer relationships",
            "Simplified product design"
          ],
          correctAnswer: 2
        },
        {
          question: "Which metric is most important in Product-as-a-Service?",
          options: [
            "Initial sale price",
            "Customer lifetime value",
            "Manufacturing cost",
            "Shipping speed"
          ],
          correctAnswer: 1
        },
        {
          question: "How does Product-as-a-Service support sustainability?",
          options: [
            "By encouraging disposable products",
            "Through increased production volume",
            "By incentivizing product longevity and repair",
            "It doesn't affect sustainability"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: 3,
    title: "Reverse Logistics and Take-Back Systems",
    description: "Learn how to design and implement effective reverse logistics systems for circular operations.",
    duration: "18:20",
    category: "Operations",
    thumbnailUrl: "https://placehold.co/600x400/png",
    videoUrl: "https://example.com/video3",
    difficulty: "advanced",
    industries: ["Manufacturing", "Retail", "Transportation"],
    author: {
      name: "Emma Thompson",
      organization: "Greenpeace",
      organizationLogo: "greenpeace",
      role: "Sustainability Consultant"
    },
    quiz: {
      questions: [
        {
          question: "What is the main purpose of reverse logistics in a circular economy?",
          options: [
            "To increase shipping costs",
            "To recover value from used products",
            "To complicate supply chains",
            "To reduce product quality"
          ],
          correctAnswer: 1
        },
        {
          question: "Which factor is most critical for a successful take-back system?",
          options: [
            "Customer convenience and incentives",
            "Complex return procedures",
            "High return fees",
            "Limited collection points"
          ],
          correctAnswer: 0
        },
        {
          question: "How does reverse logistics contribute to sustainability?",
          options: [
            "It doesn't affect sustainability",
            "By increasing waste",
            "By reducing resource extraction through material recovery",
            "Through increased transportation"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: 4,
    title: "Design for Circularity",
    description: "Explore principles and practices for designing products that support circular economy objectives.",
    duration: "25:15",
    category: "Design",
    thumbnailUrl: "https://placehold.co/600x400/png",
    videoUrl: "https://example.com/video4",
    difficulty: "intermediate",
    industries: ["Manufacturing", "Construction", "Technology"],
    author: {
      name: "Dr. James Wilson",
      organization: "CSIRO",
      organizationLogo: "csiro",
      role: "Senior Design Researcher"
    },
    quiz: {
      questions: [
        {
          question: "What is a key principle of designing for circularity?",
          options: [
            "Using non-recyclable materials",
            "Designing for single use",
            "Making repair impossible",
            "Designing for disassembly and repair"
          ],
          correctAnswer: 3
        },
        {
          question: "Why is modularity important in circular design?",
          options: [
            "It makes products more expensive",
            "It enables easy repair and upgrades",
            "It reduces product quality",
            "It increases manufacturing complexity"
          ],
          correctAnswer: 1
        },
        {
          question: "Which material choice best supports circular design?",
          options: [
            "Mixed materials that can't be separated",
            "Rare earth elements",
            "Recyclable mono-materials",
            "Non-biodegradable composites"
          ],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: 5,
    title: "Sustainable Healthcare Supply Chains",
    description: "Learn strategies for implementing circular economy principles in healthcare supply chains and medical waste management.",
    duration: "20:15",
    category: "Healthcare",
    thumbnailUrl: "https://placehold.co/600x400/png",
    videoUrl: "https://example.com/video5",
    difficulty: "intermediate",
    industries: ["Healthcare"],
    author: {
      name: "Dr. Rachel Green",
      organization: "CSIRO",
      organizationLogo: "csiro",
      role: "Healthcare Sustainability Researcher"
    },
    quiz: {
      questions: [
        {
          question: "What is a key challenge in healthcare circular economy?",
          options: [
            "Managing single-use medical items",
            "Implementing digital records",
            "Staff training",
            "Patient communication"
          ],
          correctAnswer: 0
        },
        {
          question: "Which approach best reduces medical waste?",
          options: [
            "Increased sterilization",
            "Reusable equipment programs",
            "Digital documentation",
            "Outsourcing waste management"
          ],
          correctAnswer: 1
        },
        {
          question: "How can hospitals improve their circular economy practices?",
          options: [
            "By using more disposable items",
            "By implementing take-back programs",
            "By reducing sterilization",
            "By increasing waste production"
          ],
          correctAnswer: 1
        }
      ]
    }
  },
  {
    id: 6,
    title: "Circular Construction Methods",
    description: "Discover innovative approaches to circular construction, including material reuse and sustainable building practices.",
    duration: "28:45",
    category: "Construction",
    thumbnailUrl: "https://placehold.co/600x400/png",
    videoUrl: "https://example.com/video6",
    difficulty: "advanced",
    industries: ["Construction"],
    author: {
      name: "John Builder",
      organization: "Planet Ark",
      organizationLogo: "planetark",
      role: "Sustainable Construction Expert"
    },
    quiz: {
      questions: [
        {
          question: "What is a key principle of circular construction?",
          options: [
            "Using virgin materials only",
            "Design for deconstruction",
            "Maximizing waste",
            "Single-use components"
          ],
          correctAnswer: 1
        },
        {
          question: "How can construction waste be minimized?",
          options: [
            "Through precise material ordering",
            "By using more packaging",
            "Ignoring material specifications",
            "Rushing the construction process"
          ],
          correctAnswer: 0
        },
        {
          question: "What is the benefit of modular construction?",
          options: [
            "Higher costs",
            "More waste",
            "Reduced flexibility",
            "Easier reuse and adaptation"
          ],
          correctAnswer: 3
        }
      ]
    }
  }
];

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800"
};

function getOrganizationLogo(logo: string) {
  switch (logo) {
    case 'csiro':
      return <Beaker className="h-6 w-6" />;
    case 'greenpeace':
      return <Leaf className="h-6 w-6" />;
    case 'planetark':
      return <Building2 className="h-6 w-6" />;
    default:
      return null;
  }
}

export function TrainingLibrary() {
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnswerSubmit = (answerIndex: number) => {
    const currentQuestion = selectedVideo?.quiz.questions[currentQuestionIndex];
    if (currentQuestion?.correctAnswer === answerIndex) {
      setScore(prev => prev + 1);
      toast({
        title: "Correct!",
        description: "Well done! Let's move to the next question.",
      });
    } else {
      toast({
        title: "Incorrect",
        description: "Try again on the next question!",
        variant: "destructive",
      });
    }

    if (currentQuestionIndex < (selectedVideo?.quiz.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const startQuiz = (video: TrainingVideo) => {
    setSelectedVideo(video);
    setShowQuiz(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
  };

  const resetQuiz = () => {
    setShowQuiz(false);
    setSelectedVideo(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
  };

  const filteredVideos = selectedIndustry
    ? trainingVideos.filter(video => video.industries.includes(selectedIndustry))
    : trainingVideos;

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'Manufacturing':
        return <Factory className="h-4 w-4" />;
      case 'Construction':
        return <Construction className="h-4 w-4" />;
      case 'Retail':
        return <Store className="h-4 w-4" />;
      case 'Healthcare':
        return <Hospital className="h-4 w-4" />;
      default:
        return <Recycle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Circular Strategy Training</h1>
        <p className="text-gray-600">
          Access our library of training videos to learn about implementing circular economy strategies in your business.
        </p>
      </div>

      {/* Industry Filter */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Filter by Industry</h2>
        <div className="flex flex-wrap gap-2">
          {industries.map((industry) => (
            <Button
              key={industry}
              variant={selectedIndustry === industry ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setSelectedIndustry(selectedIndustry === industry ? null : industry)}
            >
              {getIndustryIcon(industry)}
              {industry}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="aspect-video relative group">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="lg" className="gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Play Video
                </Button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-2">
                <Badge className={difficultyColors[video.difficulty]}>
                  {video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}
                </Badge>
                <Badge variant="secondary">{video.category}</Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{video.description}</p>

              {/* Industry tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {video.industries.map((industry) => (
                  <Badge key={industry} variant="outline" className="text-xs">
                    {industry}
                  </Badge>
                ))}
              </div>

              {/* Author information */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-600">
                  {getOrganizationLogo(video.author.organizationLogo)}
                </div>
                <div>
                  <p className="font-medium">{video.author.name}</p>
                  <p className="text-sm text-gray-500">{video.author.role}</p>
                  <p className="text-sm font-medium text-primary">{video.author.organization}</p>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {video.duration}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-2"
                  onClick={() => startQuiz(video)}
                >
                  <BookOpen className="h-4 w-4" />
                  Start Learning
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showQuiz} onOpenChange={(open) => !open && resetQuiz()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title} - Training Quiz</DialogTitle>
          </DialogHeader>

          {!quizCompleted ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {selectedVideo?.quiz.questions.length}
              </p>
              <p className="font-medium">
                {selectedVideo?.quiz.questions[currentQuestionIndex].question}
              </p>
              <div className="space-y-2">
                {selectedVideo?.quiz.questions[currentQuestionIndex].options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleAnswerSubmit(index)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
                <p className="text-gray-600">
                  You scored {score} out of {selectedVideo?.quiz.questions.length}
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={resetQuiz}>
                  Close
                </Button>
                <Button onClick={() => startQuiz(selectedVideo!)}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TrainingLibrary;