import { ROUTES } from "@/constants/routes";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@shared/utils/cn";

const navLinkClass = cn(
  navigationMenuTriggerStyle(),
  "h-11 rounded-none bg-transparent px-3 text-[13px] font-medium text-neutral-800 shadow-none hover:bg-neutral-200/70 focus:bg-neutral-200/70",
);

const triggerClass =
  "h-11 rounded-none bg-transparent px-3 text-[13px] font-medium text-neutral-800 shadow-none hover:bg-neutral-200/70 focus:bg-neutral-200/70 data-[state=open]:bg-neutral-200/70";

type NavbarProps = {
  currentPath?: string;
};

export function Navbar({ currentPath = "" }: NavbarProps) {
  return (
    <div className="border-b border-neutral-200 bg-neutral-100">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
        <NavigationMenu
          viewport={false}
          className="w-full max-w-none justify-start"
        >
          <NavigationMenuList className="w-max min-w-full flex-nowrap justify-start gap-0 sm:w-full sm:flex-wrap">
            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>
                Shop
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-55 gap-0.5 p-1">
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                      data-active={
                        currentPath.startsWith(ROUTES.PRODUCTS) || undefined
                      }
                    >
                      All products
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.CART}
                      className="rounded-md p-2 text-sm"
                    >
                      Shopping cart
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>
                Collections
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-55 gap-0.5 p-1">
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                    >
                      New arrivals
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                    >
                      Best sellers
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>
                Mens
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-55 gap-0.5 p-1">
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                    >
                      New arrivals
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                    >
                      Shirts
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>
                Womens
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-55 gap-0.5 p-1">
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                    >
                      New arrivals
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>
                Electronics
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-55 gap-0.5 p-1">
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                    >
                      Mobiles
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink
                      href={ROUTES.PRODUCTS}
                      className="rounded-md p-2 text-sm"
                    >
                      Laptops
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem className="ml-auto">
              <NavigationMenuLink href={ROUTES.PRODUCTS} className={navLinkClass}>
                Manage Products
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
