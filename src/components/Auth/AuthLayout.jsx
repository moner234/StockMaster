import React from 'react';
import { Package, TrendingUp, Shield, Users } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  const features = [
    {
      icon: <Package className="w-6 h-6" />,
      title: "Easy Inventory Management",
      description: "Track all your items in one place"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-time Analytics",
      description: "Get insights into your stock levels"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "Your data is always protected"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Ready",
      description: "Collaborate with your team"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">StockMaster</span>
            </div>
            <h2 className="mt-8 text-3xl font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          </div>

          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 opacity-95"></div>
        <div className="relative flex flex-col justify-center px-12 py-12">
          <div className="max-w-md">
            <h3 className="text-3xl font-bold text-white mb-8">
              Streamline Your Inventory Management
            </h3>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h4>
                    <p className="text-primary-100 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm">
              <p className="text-white text-lg italic">
                "This inventory system saved us hours every week. The analytics helped us reduce waste by 40%."
              </p>
              <div className="flex items-center mt-4">
                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">JS</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">John Smith</p>
                  <p className="text-sm text-primary-200">Retail Store Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;