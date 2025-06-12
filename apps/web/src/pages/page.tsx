import type { FC } from "react";
import Header from "../components/header/header";

type PageProps = {
  children?: React.ReactNode;
};

export const Page: FC<PageProps> = ({ children }: PageProps) => {
  return (
    <div>
      <Header />
      <div className="pt-20 px-4 lg:px-8 min-h-screen bg-gray-100">
        {children}
      </div>
    </div>
  )
}
