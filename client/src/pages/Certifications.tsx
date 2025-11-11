import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ClipboardList,
  FileCheck,
  FileSearch,
  CheckSquare
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox component

// Define certification status stages
type CertificationStage = 'not_started' | 'started' | 'applied' | 'in_progress' | 'approved' | 'expired';

interface CertificationProgress {
  id: number;
  certificationId: number;
  currentStage: CertificationStage;
  startedAt?: string;
  appliedAt?: string;
  inProgressAt?: string;
  approvedAt?: string;
  expiredAt?: string;
  nextSteps?: string[];
  notes?: string;
}

interface CertificationType {
  id: number;
  name: string;
  description: string;
  requirements: string[];
  validityPeriod: number;
  industry: string | string[];
  difficulty: 'Low' | 'Medium' | 'Medium-High' | 'High';
  provider: string;
  providerUrl: string;
  estimatedTime: string;
  cost: string;
  relevance: number;
}

interface UserCertification {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  applicationDate: string;
  issueDate?: string;
  expiryDate?: string;
  certificationType: CertificationType;
}

// Mock certifications data with more options and industry specifics
const mockCertifications: CertificationType[] = [
  {
    id: 1,
    name: "ISO 14001 - Environmental Management",
    description: "International standard for environmental management systems",
    requirements: [
      "Environmental policy",
      "Environmental aspects assessment",
      "Legal compliance documentation",
      "Management review process"
    ],
    validityPeriod: 36,
    industry: ["Manufacturing", "Construction", "Energy", "All Industries"],
    difficulty: "High",
    provider: "ISO",
    providerUrl: "https://www.iso.org",
    estimatedTime: "6-12 months",
    cost: "High",
    relevance: 5
  },
  {
    id: 2,
    name: "GRESB Assessment",
    description: "Global ESG benchmark for real estate and infrastructure",
    requirements: [
      "Asset portfolio documentation",
      "Energy consumption data",
      "Stakeholder engagement evidence",
      "ESG policies"
    ],
    validityPeriod: 12,
    industry: ["Real Estate", "Infrastructure"],
    difficulty: "Medium-High",
    provider: "GRESB",
    providerUrl: "https://gresb.com",
    estimatedTime: "3-4 months",
    cost: "High",
    relevance: 4
  },
  {
    id: 3,
    name: "GRI Sustainability Reporting",
    description: "Global standards for sustainability reporting",
    requirements: [
      "Materiality assessment",
      "Stakeholder engagement",
      "Data collection systems",
      "Report preparation"
    ],
    validityPeriod: 24,
    industry: ["All Industries"],
    difficulty: "Medium",
    provider: "GRI",
    providerUrl: "https://www.globalreporting.org",
    estimatedTime: "4-6 months",
    cost: "Medium",
    relevance: 3
  },
  {
    id: 4,
    name: "AWS Environmental Stewardship",
    description: "Alliance for Water Stewardship certification",
    requirements: [
      "Water usage assessment",
      "Catchment management plan",
      "Stakeholder engagement",
      "Performance tracking"
    ],
    validityPeriod: 36,
    industry: ["Manufacturing", "Agriculture", "Food & Beverage"],
    difficulty: "High",
    provider: "AWS",
    providerUrl: "https://a4ws.org",
    estimatedTime: "8-12 months",
    cost: "High",
    relevance: 5
  },
  {
    id: 5,
    name: "Cradle to Cradle Certified",
    description: "Product sustainability certification for circular economy",
    requirements: [
      "Material health assessment",
      "Material reutilization plan",
      "Renewable energy use",
      "Water stewardship"
    ],
    validityPeriod: 24,
    industry: ["Manufacturing", "Consumer Goods", "Textiles"],
    difficulty: "High",
    provider: "C2C",
    providerUrl: "https://www.c2ccertified.org",
    estimatedTime: "6-9 months",
    cost: "High",
    relevance: 4
  },
  {
    id: 6,
    name: "BREEAM Certification",
    description: "Building sustainability assessment method",
    requirements: [
      "Energy efficiency assessment",
      "Materials documentation",
      "Waste management plan",
      "Transport assessment"
    ],
    validityPeriod: 36,
    industry: ["Construction", "Real Estate"],
    difficulty: "Medium-High",
    provider: "BRE Group",
    providerUrl: "https://www.breeam.com",
    estimatedTime: "4-8 months",
    cost: "Medium",
    relevance: 4
  },
  {
    id: 7,
    name: "FSC Chain of Custody",
    description: "Forest Stewardship Council supply chain certification",
    requirements: [
      "Material sourcing documentation",
      "Chain of custody procedures",
      "Staff training records",
      "Volume control system"
    ],
    validityPeriod: 60,
    industry: ["Forestry", "Paper", "Furniture", "Construction"],
    difficulty: "Medium",
    provider: "FSC",
    providerUrl: "https://fsc.org",
    estimatedTime: "3-6 months",
    cost: "Medium",
    relevance: 5
  },
  {
    id: 8,
    name: "Zero Waste Certification",
    description: "TRUE Zero Waste certification program",
    requirements: [
      "Waste audit",
      "Zero waste policy",
      "Diversion rate documentation",
      "Employee training program"
    ],
    validityPeriod: 24,
    industry: ["Manufacturing", "Retail", "Food Service", "All Industries"],
    difficulty: "Medium",
    provider: "GBCI",
    providerUrl: "https://true.gbci.org",
    estimatedTime: "4-8 months",
    cost: "Medium",
    relevance: 3
  },
  {
    id: 9,
    name: "EcoVadis Sustainability Rating",
    description: "Supply chain sustainability assessment and rating platform",
    requirements: [
      "CSR documentation",
      "Environmental performance data",
      "Labor practices evidence",
      "Supply chain ethics documentation"
    ],
    validityPeriod: 12,
    industry: ["All Industries", "Manufacturing", "Logistics"],
    difficulty: "Medium",
    provider: "EcoVadis",
    providerUrl: "https://ecovadis.com",
    estimatedTime: "2-3 months",
    cost: "Medium",
    relevance: 4
  },
  {
    id: 10,
    name: "B Corp Certification",
    description: "Certification for businesses meeting high social and environmental performance standards",
    requirements: [
      "B Impact Assessment",
      "Legal accountability documentation",
      "Transparency requirements",
      "Performance verification"
    ],
    validityPeriod: 36,
    industry: ["All Industries"],
    difficulty: "High",
    provider: "B Lab",
    providerUrl: "https://bcorporation.net",
    estimatedTime: "6-10 months",
    cost: "Medium",
    relevance: 5
  },
  {
    id: 11,
    name: "LEED Certification",
    description: "Leadership in Energy and Environmental Design green building certification",
    requirements: [
      "Energy efficiency documentation",
      "Water efficiency evidence",
      "Material selection criteria",
      "Indoor environmental quality"
    ],
    validityPeriod: 60,
    industry: ["Construction", "Real Estate", "Architecture"],
    difficulty: "High",
    provider: "USGBC",
    providerUrl: "https://www.usgbc.org",
    estimatedTime: "12-24 months",
    cost: "High",
    relevance: 5
  },
  {
    id: 12,
    name: "SBTi Certification",
    description: "Science Based Targets initiative for climate action",
    requirements: [
      "Emissions inventory",
      "Target setting documentation",
      "Progress tracking system",
      "Climate action plan"
    ],
    validityPeriod: 24,
    industry: ["All Industries", "Energy", "Manufacturing"],
    difficulty: "High",
    provider: "SBTi",
    providerUrl: "https://sciencebasedtargets.org",
    estimatedTime: "6-12 months",
    cost: "High",
    relevance: 5
  }
];

const INDUSTRIES = [
  "All Industries",
  "Manufacturing",
  "Construction",
  "Energy",
  "Real Estate",
  "Infrastructure",
  "Agriculture",
  "Food & Beverage",
  "Consumer Goods",
  "Textiles",
  "Forestry",
  "Paper",
  "Furniture",
  "Retail",
  "Food Service",
  "Logistics",
  "Architecture"
];

const getNextStage = (currentStage: CertificationStage): CertificationStage => {
  const stageOrder: CertificationStage[] = ['started', 'applied', 'in_progress', 'approved'];
  const currentIndex = stageOrder.indexOf(currentStage);
  return stageOrder[currentIndex + 1] || currentStage;
};

const getPreviousStage = (currentStage: CertificationStage): CertificationStage => {
  const stageOrder: CertificationStage[] = ['started', 'applied', 'in_progress', 'approved'];
  const currentIndex = stageOrder.indexOf(currentStage);
  return stageOrder[currentIndex - 1] || 'started';
};

export default function CertificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All Industries");

  // Fetch certifications data
  const { data: certifications = mockCertifications, isLoading: loadingCerts } = useQuery<CertificationType[]>({
    queryKey: ["/api/certifications"],
  });

  const { data: userCertifications = [], isLoading: loadingUserCerts } = useQuery<UserCertification[]>({
    queryKey: ["/api/user-certifications"],
  });

  const { data: certificationProgress = [], isLoading: loadingProgress } = useQuery<CertificationProgress[]>({
    queryKey: ["/api/certification-progress"],
  });

  // Now we can safely filter certifications since all data is loaded
  const filteredCertifications = !loadingProgress ? certifications
    .filter(cert => {
      // Filter by industry
      const industryMatch = selectedIndustry === "All Industries" ||
        (Array.isArray(cert.industry)
          ? cert.industry.includes(selectedIndustry)
          : cert.industry === selectedIndustry);

      // Check if certification is not already started
      const notStarted = !certificationProgress.some(
        progress => progress.certificationId === cert.id
      );

      return industryMatch && notStarted;
    })
    .sort((a, b) => b.relevance - a.relevance) : [];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    expired: "bg-gray-500",
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    expired: XCircle,
  };

  async function startCertificationProcess(certType: CertificationType) {
    try {
      const response = await fetch("/api/certifications/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificationTypeId: certType.id }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Process Started",
        description: "Your certification process has been initiated. Track your progress in the Tracking tab.",
      });

      // Invalidate both certifications progress and user certifications queries
      queryClient.invalidateQueries({ queryKey: ["/api/certification-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-certifications"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start certification process",
      });
    }
  }

  const renderCertificationCard = (cert: CertificationType) => (
    <Card key={cert.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{cert.name}</CardTitle>
            <CardDescription>{cert.description}</CardDescription>
          </div>
          <Badge variant={
            cert.difficulty === 'High' ? 'destructive' :
            cert.difficulty === 'Medium-High' ? 'secondary' :
            'default'
          }>
            {cert.difficulty} Difficulty
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Requirements:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {cert.requirements.map((req, idx) => (
                <li key={idx} className="text-sm text-gray-600">{req}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {Array.isArray(cert.industry) ? (
                cert.industry.map((ind, idx) => (
                  <Badge key={idx} variant="outline">{ind}</Badge>
                ))
              ) : (
                <Badge variant="outline">{cert.industry}</Badge>
              )}
              <Badge variant="outline">{cert.validityPeriod} months validity</Badge>
            </div>

            <div className="text-sm text-gray-600">
              <p>Provider: {cert.provider}</p>
              <p>Estimated Time: {cert.estimatedTime}</p>
              <p>Cost Level: {cert.cost}</p>
            </div>

            <div className="pt-4 flex gap-2">
              <a
                href={cert.providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Visit Provider Website
              </a>
              <Button
                onClick={() => startCertificationProcess(cert)}
                size="sm"
              >
                Start Process
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getStageIcon = (stage: CertificationStage, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckSquare className="h-5 w-5 text-green-500" />;
    }
    switch (stage) {
      case 'started':
        return <ClipboardList className="h-5 w-5 text-blue-500" />;
      case 'applied':
        return <FileCheck className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <FileSearch className="h-5 w-5 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderProgressCard = (progress: CertificationProgress) => {
    const certification = certifications?.find(c => c.id === progress.certificationId);
    if (!certification) return null;

    const stages: { key: CertificationStage; label: string; date?: string }[] = [
      { key: 'started', label: 'Process Started', date: progress.startedAt },
      { key: 'applied', label: 'Application Submitted', date: progress.appliedAt },
      { key: 'in_progress', label: 'Application in Review', date: progress.inProgressAt },
      { key: 'approved', label: 'Certification Approved', date: progress.approvedAt }
    ];

    const updateStage = async (stage: CertificationStage, checked: boolean) => {
      try {
        const stageOrder: CertificationStage[] = ['started', 'applied', 'in_progress', 'approved'];
        const stageIndex = stageOrder.indexOf(stage);
        const currentIndex = stageOrder.indexOf(progress.currentStage);

        // When checking, only allow moving to the next stage
        if (checked && stageIndex !== currentIndex + 1) {
          toast({
            variant: 'destructive',
            title: 'Invalid Stage',
            description: 'Please complete the stages in order',
          });
          return;
        }

        // When unchecking, only allow unchecking the current stage
        if (!checked && stage !== progress.currentStage) {
          toast({
            variant: 'destructive',
            title: 'Invalid Action',
            description: 'You can only uncheck the current stage',
          });
          return;
        }

        const response = await fetch(`/api/certification-progress/${progress.id}/update-stage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage,
            checked,
            newStatus: checked ? stage : getPreviousStage(stage)
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/certification-progress'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user-certifications'] });

        toast({
          title: checked ? 'Progress Updated' : 'Progress Reset',
          description: checked
            ? 'Successfully updated certification progress.'
            : 'Successfully reset certification progress.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update progress',
        });
      }
    };

    return (
      <Card key={progress.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{certification.name}</CardTitle>
              <CardDescription>{certification.description}</CardDescription>
            </div>
            <Badge variant={
              progress.currentStage === 'approved' ? 'default' :
              progress.currentStage === 'in_progress' ? 'secondary' :
              'outline'
            }>
              {progress.currentStage.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Checklist */}
            <div className="space-y-4">
              {stages.map((stage) => {
                const stageOrder = ['started', 'applied', 'in_progress', 'approved'];
                const currentStageIndex = stageOrder.indexOf(progress.currentStage);
                const thisStageIndex = stageOrder.indexOf(stage.key);

                const isCompleted = thisStageIndex <= currentStageIndex;
                const isNextStage = thisStageIndex === currentStageIndex + 1;
                const isCurrent = progress.currentStage === stage.key;

                return (
                  <div
                    key={stage.key}
                    className={`flex items-center space-x-3 p-2 rounded-lg border ${
                      isCurrent ? 'bg-secondary/10 border-secondary' : 'border-border'
                    }`}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked) => {
                        if (isCurrent || isNextStage) {
                          updateStage(stage.key, checked === true);
                        }
                      }}
                      disabled={!isCurrent && !isNextStage}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{stage.label}</p>
                      {stage.date && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(stage.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Steps */}
            {progress.nextSteps && progress.nextSteps.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Next Steps:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {progress.nextSteps.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {progress.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes:</h4>
                <p className="text-sm text-gray-600">{progress.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loadingCerts || loadingUserCerts || loadingProgress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Environmental Certifications</h1>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Certifications</TabsTrigger>
          <TabsTrigger value="my-certs">My Certifications</TabsTrigger>
          <TabsTrigger value="tracking">Certification Tracking</TabsTrigger>
        </TabsList>

        {/* Available Certifications Tab */}
        <TabsContent value="available" className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Industry
            </label>
            <Select
              value={selectedIndustry}
              onValueChange={setSelectedIndustry}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCertifications.map(renderCertificationCard)}
          </div>
        </TabsContent>

        {/* My Certifications Tab */}
        <TabsContent value="my-certs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userCertifications?.map(cert => (
              <Card key={cert.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{cert.certificationType.name}</CardTitle>
                    <Badge className={statusColors[cert.status]}>
                      <div className="flex items-center gap-1">
                        {React.createElement(statusIcons[cert.status as keyof typeof statusIcons], { className: "h-4 w-4" })}
                        <span className="capitalize">{cert.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardDescription>{cert.certificationType.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm">Applied: {new Date(cert.applicationDate).toLocaleDateString()}</p>
                      {cert.issueDate && (
                        <p className="text-sm">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                      )}
                      {cert.expiryDate && (
                        <p className="text-sm">Expires: {new Date(cert.expiryDate).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={cert.certificationType.providerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Visit Provider Website
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* New Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {loadingProgress ? (
              <div className="col-span-1 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : certificationProgress.length > 0 ? (
              certificationProgress.map(renderProgressCard)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    No certification applications in progress.
                    Start by applying for a certification from the Available Certifications tab.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}