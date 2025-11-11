import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { Tag } from "@/components/ui/tag";
import { useState } from "react";
import { ShoppingCart, Package, Battery, Gauge, Recycle, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  inStock: boolean;
  imageUrl: string;
  status: string;
}

const categories = ["All", "Sensors", "Equipment", "Software", "Education"];

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'sensors':
      return <Gauge className="h-6 w-6" />;
    case 'equipment':
      return <Package className="h-6 w-6" />;
    case 'software':
      return <Battery className="h-6 w-6" />;
    case 'education':
      return <Recycle className="h-6 w-6" />;
    default:
      return <Package className="h-6 w-6" />;
  }
};

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("name-asc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
  });

  const filteredProducts = products
    .filter(product => 
      (searchQuery === "" || 
       product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       product.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedCategory === "All" || product.category === selectedCategory) &&
      (product.price >= priceRange[0] && product.price <= priceRange[1])
    )
    .sort((a, b) => {
      switch (selectedSort) {
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default: // name-asc
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Sustainability Products"
        subtitle="Browse our curated selection of sustainability and waste management products"
      />

      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(product.category)}
                    <span className="text-sm font-medium text-muted-foreground">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {product.tags.map((tag) => (
                      <Tag key={tag} variant="secondary">{tag}</Tag>
                    ))}
                  </div>
                </div>

                <h3 className="mb-2 text-xl font-semibold">{product.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {product.description}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-bold">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  <Button variant={product.inStock ? "default" : "secondary"} disabled={!product.inStock}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}