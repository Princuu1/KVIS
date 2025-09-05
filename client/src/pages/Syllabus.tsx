import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Nav from "@/components/Nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Calendar, CheckCircle, Circle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface SyllabusItem {
  id: string;
  subject: string;
  topic: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export default function Syllabus() {
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({
    subject: "",
    topic: "",
    description: "",
    dueDate: "",
  });
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch syllabus items
  const { data: syllabusData, isLoading } = useQuery({
    queryKey: ["/api/syllabus"],
    staleTime: 2 * 60 * 1000,
  });

  const syllabusItems: SyllabusItem[] = syllabusData?.syllabus || [];

  const createTopicMutation = useMutation({
    mutationFn: api.syllabus.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/syllabus"] });
      toast({
        title: "Success",
        description: "Syllabus topic added successfully",
      });
      setIsAddTopicOpen(false);
      setNewTopic({
        subject: "",
        topic: "",
        description: "",
        dueDate: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add syllabus topic",
        variant: "destructive",
      });
    },
  });

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.subject || !newTopic.topic) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    createTopicMutation.mutate({
      ...newTopic,
      completed: false,
      dueDate: newTopic.dueDate ? new Date(newTopic.dueDate).toISOString() : undefined,
    });
  };

  // Filter syllabus items
  const filteredItems = syllabusItems.filter(item => {
    if (filter === 'completed') return item.completed;
    if (filter === 'pending') return !item.completed;
    return true;
  });

  // Group by subject
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.subject]) {
      acc[item.subject] = [];
    }
    acc[item.subject].push(item);
    return acc;
  }, {} as Record<string, SyllabusItem[]>);

  const getStatusBadge = (completed: boolean, dueDate?: string) => {
    if (completed) {
      return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    }
    
    if (dueDate) {
      const today = new Date();
      const due = new Date(dueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return <Badge variant="destructive">Overdue</Badge>;
      } else if (diffDays <= 3) {
        return <Badge className="bg-orange-100 text-orange-700">Due Soon</Badge>;
      }
    }
    
    return <Badge variant="secondary">Pending</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCompletionStats = () => {
    const total = syllabusItems.length;
    const completed = syllabusItems.filter(item => item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  };

  const stats = getCompletionStats();

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Course Syllabus</h2>
                  <p className="text-muted-foreground">Track your learning progress</p>
                </div>
                <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-topic">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Topic
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Syllabus Topic</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTopic} className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          value={newTopic.subject}
                          onChange={(e) => setNewTopic(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Enter subject name"
                          required
                          data-testid="input-topic-subject"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="topic">Topic *</Label>
                        <Input
                          id="topic"
                          value={newTopic.topic}
                          onChange={(e) => setNewTopic(prev => ({ ...prev, topic: e.target.value }))}
                          placeholder="Enter topic name"
                          required
                          data-testid="input-topic-name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTopic.description}
                          onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter topic description"
                          data-testid="textarea-topic-description"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newTopic.dueDate}
                          onChange={(e) => setNewTopic(prev => ({ ...prev, dueDate: e.target.value }))}
                          data-testid="input-topic-due-date"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={createTopicMutation.isPending}
                          data-testid="button-create-topic"
                        >
                          {createTopicMutation.isPending ? "Adding..." : "Add Topic"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddTopicOpen(false)}
                          data-testid="button-cancel-topic"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Progress Summary */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2" data-testid="text-completion-percentage">
                      {stats.percentage}%
                    </div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2" data-testid="text-completed-topics">
                      {stats.completed}
                    </div>
                    <p className="text-sm text-muted-foreground">Topics Completed</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2" data-testid="text-total-topics">
                      {stats.total}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Topics</p>
                  </div>
                </div>
                
                {stats.total > 0 && (
                  <div className="mt-6">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                data-testid="filter-all"
              >
                All Topics ({syllabusItems.length})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                data-testid="filter-pending"
              >
                Pending ({syllabusItems.filter(item => !item.completed).length})
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilter('completed')}
                data-testid="filter-completed"
              >
                Completed ({syllabusItems.filter(item => item.completed).length})
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading syllabus...</p>
              </div>
            ) : Object.keys(groupedItems).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([subject, items]) => (
                  <Card key={subject}>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" />
                        {subject}
                        <Badge variant="outline" className="ml-2">
                          {items.filter(item => item.completed).length}/{items.length}
                        </Badge>
                      </h3>
                      
                      <div className="space-y-4">
                        {items.map((item, index) => (
                          <div 
                            key={item.id} 
                            className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                            data-testid={`syllabus-item-${index}`}
                          >
                            <div className="mt-1">
                              {item.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {item.topic}
                                </h4>
                                {getStatusBadge(item.completed, item.dueDate)}
                              </div>
                              
                              {item.description && (
                                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                              )}
                              
                              {item.dueDate && (
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due: {formatDate(item.dueDate)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" data-testid={`button-edit-topic-${index}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" data-testid={`button-delete-topic-${index}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="empty-syllabus">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No syllabus topics</h3>
                <p className="text-muted-foreground mb-6">Add your first topic to start tracking your progress</p>
                <Button onClick={() => setIsAddTopicOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
