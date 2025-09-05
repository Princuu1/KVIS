import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, MapPin, Edit, Bell, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ExamScheduleItem {
  id: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  instructions?: string;
  createdAt: string;
}

export default function ExamSchedule() {
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    subject: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    instructions: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam schedule
  const { data: examsData, isLoading } = useQuery({
    queryKey: ["/api/exams"],
    staleTime: 5 * 60 * 1000,
  });

  const exams: ExamScheduleItem[] = examsData?.exams || [];

  const createExamMutation = useMutation({
    mutationFn: api.exams.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({
        title: "Success",
        description: "Exam added successfully",
      });
      setIsAddExamOpen(false);
      setNewExam({
        subject: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        instructions: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add exam",
        variant: "destructive",
      });
    },
  });

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.subject || !newExam.date || !newExam.startTime || !newExam.endTime || !newExam.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createExamMutation.mutate({
      ...newExam,
      date: new Date(newExam.date).toISOString(),
    });
  };

  const getExamStatus = (examDate: string) => {
    const today = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Completed', className: 'bg-gray-100 text-gray-700' };
    } else if (diffDays === 0) {
      return { label: 'Today', className: 'bg-red-100 text-red-700' };
    } else if (diffDays <= 7) {
      return { label: 'This Week', className: 'bg-orange-100 text-orange-700' };
    } else {
      return { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Sort exams by date
  const sortedExams = exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Separate upcoming and past exams
  const today = new Date();
  const upcomingExams = sortedExams.filter(exam => new Date(exam.date) >= today);
  const pastExams = sortedExams.filter(exam => new Date(exam.date) < today);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Exam Schedule</h2>
                  <p className="text-muted-foreground">View and manage exam schedules</p>
                </div>
                <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-exam">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Exam</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateExam} className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          value={newExam.subject}
                          onChange={(e) => setNewExam(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Enter subject name"
                          required
                          data-testid="input-exam-subject"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="date">Exam Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newExam.date}
                          onChange={(e) => setNewExam(prev => ({ ...prev, date: e.target.value }))}
                          required
                          data-testid="input-exam-date"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Start Time *</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={newExam.startTime}
                            onChange={(e) => setNewExam(prev => ({ ...prev, startTime: e.target.value }))}
                            required
                            data-testid="input-exam-start-time"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="endTime">End Time *</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={newExam.endTime}
                            onChange={(e) => setNewExam(prev => ({ ...prev, endTime: e.target.value }))}
                            required
                            data-testid="input-exam-end-time"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={newExam.location}
                          onChange={(e) => setNewExam(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="e.g., Hall A, Block 1"
                          required
                          data-testid="input-exam-location"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={newExam.instructions}
                          onChange={(e) => setNewExam(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="Special instructions for the exam"
                          data-testid="textarea-exam-instructions"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={createExamMutation.isPending}
                          data-testid="button-create-exam"
                        >
                          {createExamMutation.isPending ? "Adding..." : "Add Exam"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddExamOpen(false)}
                          data-testid="button-cancel-exam"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading exam schedule...</p>
              </div>
            ) : (
              <>
                {/* Upcoming Exams */}
                {upcomingExams.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Exams</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingExams.map((exam, index) => {
                        const status = getExamStatus(exam.date);
                        
                        return (
                          <Card key={exam.id} className="hover:shadow-lg transition-shadow" data-testid={`exam-card-${index}`}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-foreground">{exam.subject}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
                                  {status.label}
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">{formatDate(exam.date)}</span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">
                                    {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">{exam.location}</span>
                                </div>
                                
                                {exam.instructions && (
                                  <div className="mt-3 p-3 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">{exam.instructions}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    data-testid={`button-edit-exam-${index}`}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="flex-1"
                                    data-testid={`button-remind-exam-${index}`}
                                  >
                                    <Bell className="w-4 h-4 mr-1" />
                                    Remind
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past Exams */}
                {pastExams.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Past Exams</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pastExams.slice(0, 6).map((exam, index) => (
                        <Card key={exam.id} className="opacity-75" data-testid={`past-exam-card-${index}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-foreground">{exam.subject}</h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                Completed
                              </span>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">{formatDate(exam.date)}</span>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">{exam.location}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {exams.length === 0 && (
                  <div className="text-center py-12" data-testid="empty-exams">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No exams scheduled</h3>
                    <p className="text-muted-foreground mb-6">Add your first exam to get started</p>
                    <Button onClick={() => setIsAddExamOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Exam
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
