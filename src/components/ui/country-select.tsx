import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  code: string;
  name: string;
}

// Using flag icons from flagcdn.com
const getFlagIcon = (countryCode: string) => {
  return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
};

// Get country name from country code
export const getCountryName = (countryCode: string): string => {
  const country = countries.find(c => c.code === countryCode);
  return country ? country.name : countryCode;
};

const countries: Country[] = [
  { code: "EG", name: "Egypt" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "SK", name: "Slovakia" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "GR", name: "Greece" },
  { code: "PT", name: "Portugal" },
  { code: "IE", name: "Ireland" },
  { code: "IS", name: "Iceland" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "CY", name: "Cyprus" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
  { code: "BY", name: "Belarus" },
  { code: "LT", name: "Lithuania" },
  { code: "LV", name: "Latvia" },
  { code: "EE", name: "Estonia" },
  { code: "MD", name: "Moldova" },
  { code: "AL", name: "Albania" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "HR", name: "Croatia" },
  { code: "ME", name: "Montenegro" },
  { code: "MK", name: "North Macedonia" },
  { code: "RS", name: "Serbia" },
  { code: "SI", name: "Slovenia" },
  { code: "XK", name: "Kosovo" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "NP", name: "Nepal" },
  { code: "BT", name: "Bhutan" },
  { code: "MV", name: "Maldives" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "BN", name: "Brunei" },
  { code: "KH", name: "Cambodia" },
  { code: "LA", name: "Laos" },
  { code: "MM", name: "Myanmar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "JO", name: "Jordan" },
  { code: "LB", name: "Lebanon" },
  { code: "SY", name: "Syria" },
  { code: "IQ", name: "Iraq" },
  { code: "IR", name: "Iran" },
  { code: "AF", name: "Afghanistan" },
  { code: "TR", name: "Turkey" },
  { code: "IL", name: "Israel" },
  { code: "PS", name: "Palestine" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "ET", name: "Ethiopia" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "RW", name: "Rwanda" },
  { code: "MA", name: "Morocco" },
  { code: "DZ", name: "Algeria" },
  { code: "TN", name: "Tunisia" },
  { code: "LY", name: "Libya" },
  { code: "SD", name: "Sudan" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Ecuador" },
  { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" },
  { code: "BO", name: "Bolivia" },
  { code: "GY", name: "Guyana" },
  { code: "SR", name: "Suriname" },
  { code: "MX", name: "Mexico" },
  { code: "GT", name: "Guatemala" },
  { code: "BZ", name: "Belize" },
  { code: "SV", name: "El Salvador" },
  { code: "HN", name: "Honduras" },
  { code: "NI", name: "Nicaragua" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panama" },
];

export interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export const CountrySelect = React.forwardRef<HTMLButtonElement, CountrySelectProps>(
  ({ value, onChange, placeholder = "Select country", disabled, className, id, name, required, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selectedCountry = countries.find(country => country.code === value);

    const handleCountrySelect = (country: Country) => {
      onChange(country.code);
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-10", className)}
            disabled={disabled}
            id={id}
            {...props}
          >
            {selectedCountry ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-4 flex items-center justify-center">
                  <img 
                    src={getFlagIcon(selectedCountry.code)} 
                    alt={`${selectedCountry.name} flag`}
                    className="w-5 h-4 object-cover rounded-sm"
                    onError={(e) => {
                      // Fallback to country code if image fails to load
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<span class="text-xs font-medium text-muted-foreground">${selectedCountry.code}</span>`;
                    }}
                  />
                </div>
                <span className="text-sm font-medium truncate">{selectedCountry.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.code}`}
                    onSelect={() => handleCountrySelect(country)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-5 h-4 flex items-center justify-center">
                        <img 
                          src={getFlagIcon(country.code)} 
                          alt={`${country.name} flag`}
                          className="w-5 h-4 object-cover rounded-sm"
                          onError={(e) => {
                            // Fallback to country code if image fails to load
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<span class="text-xs font-medium text-muted-foreground">${country.code}</span>`;
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium truncate">{country.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 ml-2 flex-shrink-0",
                        selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

CountrySelect.displayName = "CountrySelect";
