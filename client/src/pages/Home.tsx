import { useNews } from "@/hooks/use-news";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { data, isLoading, error } = useNews();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold">AI News Feed</h1>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading News</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {error || "Failed to load news feed. Please try again later."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">AI News Feed</h1>
      <div className="space-y-4">
        {data.items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-grow">
                    <h2 className="text-xl font-semibold hover:text-primary">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        {item.title}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </h2>
                    {/* Summary section */}
                    <div className="text-muted-foreground">
                      {item.summary && (
                        <div className={expandedItems.has(item.id) ? '' : 'line-clamp-2'}>
                          {item.summary}
                        </div>
                      )}
                      {item.summary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(item.id)}
                          className="mt-2"
                        >
                          {expandedItems.has(item.id) ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          )}
                          {expandedItems.has(item.id) ? 'Show less' : 'Read more'}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{item.source}</Badge>
                      {item.priority && (
                        <Badge variant="outline">{item.priority}</Badge>
                      )}
                      {item.contentCategory?.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {item.score && (
                    <Badge variant="secondary" className="shrink-0">
                      {item.score} points
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}