
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, SearchIcon, PhoneIcon, CarIcon, MapPinIcon, ClockIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { CarService, SearchServicesInput, VehicleType } from '../../server/src/schema';
import type { ServiceDetails } from '../../server/src/handlers/get_service_details';

function App() {
  const [services, setServices] = useState<CarService[]>([]);
  const [searchResults, setSearchResults] = useState<CarService[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Search form state
  const [searchData, setSearchData] = useState<SearchServicesInput>({
    pickup_location: '',
    destination: '',
    vehicle_type: undefined,
    pickup_time: undefined,
    passenger_count: undefined
  });

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getCarServices.query();
      setServices(result);
      setSearchResults(result); // Show all services initially
    } catch (error) {
      console.error('Failed to load services:', error);
      // For demo purposes with stub data
      setServices([]);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const result = await trpc.searchServices.query(searchData);
      setSearchResults(result);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleServiceClick = async (serviceId: number) => {
    try {
      setIsLoading(true);
      const details = await trpc.getServiceDetails.query({ serviceId });
      setSelectedService(details);
    } catch (error) {
      console.error('Failed to load service details:', error);
      setSelectedService(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchData({
      pickup_location: '',
      destination: '',
      vehicle_type: undefined,
      pickup_time: undefined,
      passenger_count: undefined
    });
    setSearchResults(services);
  };

  const vehicleTypeOptions: { value: VehicleType; label: string }[] = [
    { value: '4-seater', label: '🚗 4-seater' },
    { value: '7-seater', label: '🚐 7-seater' },
    { value: '16-seater', label: '🚌 16-seater' },
    { value: 'other', label: '🚛 Other' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚗 Car Service Finder
          </h1>
          <p className="text-gray-600 text-lg">
            Find and book reliable car services for your journey
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="w-5 h-5" />
              Search Car Services
            </CardTitle>
            <CardDescription>
              Find the perfect car service for your trip
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">📍 Pickup Location</label>
                <Input
                  placeholder="e.g., Hanoi, Airport..."
                  value={searchData.pickup_location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchData((prev: SearchServicesInput) => ({ ...prev, pickup_location: e.target.value || undefined }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">🎯 Destination</label>
                <Input
                  placeholder="e.g., My Duc, City Center..."
                  value={searchData.destination || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchData((prev: SearchServicesInput) => ({ ...prev, destination: e.target.value || undefined }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">🚗 Vehicle Type</label>
                <Select
                  value={searchData.vehicle_type || ''}
                  onValueChange={(value: VehicleType) =>
                    setSearchData((prev: SearchServicesInput) => ({ ...prev, vehicle_type: value || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">📅 Pickup Time</label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {searchData.pickup_time ? format(searchData.pickup_time, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={searchData.pickup_time}
                      onSelect={(date: Date | undefined) => {
                        setSearchData((prev: SearchServicesInput) => ({ ...prev, pickup_time: date }));
                        setShowCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">👥 Passengers</label>
                <Input
                  type="number"
                  placeholder="Number of passengers"
                  min="1"
                  max="20"
                  value={searchData.passenger_count || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchData((prev: SearchServicesInput) => ({ ...prev, passenger_count: parseInt(e.target.value) || undefined }))
                  }
                />
              </div>

              <div className="flex gap-2 items-end">
                <Button type="submit" disabled={isSearching} className="flex-1">
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
                <Button type="button" variant="outline" onClick={resetSearch}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Service Details Modal/Panel */}
        {selectedService && (
          <Card className="mb-8 border-2 border-blue-200 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-blue-900">
                    {selectedService.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <PhoneIcon className="w-4 h-4" />
                    {selectedService.phone}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedService(null)}>
                  ✕ Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedService.description && (
                <p className="text-gray-600 mb-4">{selectedService.description}</p>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CarIcon className="w-4 h-4" />
                    Available Vehicles ({selectedService.vehicles.length})
                  </h3>
                  {selectedService.vehicles.length === 0 ? (
                    <p className="text-gray-500 italic">No vehicles data available yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedService.vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="border rounded p-3">
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary">{vehicle.type}</Badge>
                            <span className="text-sm">Capacity: {vehicle.capacity}</span>
                          </div>
                          {vehicle.description && (
                            <p className="text-sm text-gray-600 mt-1">{vehicle.description}</p>
                          )}
                          <Badge variant={vehicle.is_available ? 'default' : 'destructive'} className="mt-2">
                            {vehicle.is_available ? 'Available' : 'Not Available'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    Routes ({selectedService.routes.length})
                  </h3>
                  {selectedService.routes.length === 0 ? (
                    <p className="text-gray-500 italic">No routes data available yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedService.routes.map((route) => (
                        <div key={route.id} className="border rounded p-3">
                          <div className="font-medium">
                            {route.pickup_location} → {route.destination}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-lg font-semibold text-green-600">
                              ${route.price.toFixed(2)}
                            </span>
                            {route.duration_minutes && (
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {route.duration_minutes} min
                              </span>
                            )}
                          </div>
                          <Badge variant={route.is_active ? 'default' : 'secondary'} className="mt-2">
                            {route.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Services ({searchResults.length})
            </h2>
            {searchResults.length === 0 && !isLoading && (
              <Badge variant="secondary">
                📋 Using stub data - connect to database for real services
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading services...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No Services Found</h3>
                <p className="text-gray-600 mb-4">
                  {services.length === 0 
                    ? "The backend handlers are currently using stub data. Connect to a database to see real car services."
                    : "Try adjusting your search criteria to find available services."}
                </p>
                <Button onClick={resetSearch} variant="outline">
                  Show All Services
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((service: CarService) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleServiceClick(service.id)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{service.name}</span>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? '✅ Active' : '⏸️ Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      {service.phone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {service.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{service.description}</p>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>📅 {service.created_at.toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        View Details →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t">
          <p className="text-gray-500">
            🚗 Car Service Finder - Connecting you with reliable transportation
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
