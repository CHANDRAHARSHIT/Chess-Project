import React from "react";
import { MembershipFeatureBanner } from "./MembershipFeatureBanner";
import { pricingFeatures } from "@/features/billing/pricingFeatures";

export interface MembershipFeaturesSectionProps {
  onChoosePlan?: () => void;
}

export const MembershipFeaturesSection: React.FC<MembershipFeaturesSectionProps> = ({
  onChoosePlan,
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      {pricingFeatures.map((feature) => (
        <MembershipFeatureBanner
          key={feature.id}
          title={feature.title}
          subtitle={feature.subtitle}
          description={feature.description}
          image={feature.image}
          reverse={feature.reverse}
          buttonText={feature.buttonText}
          onButtonClick={onChoosePlan}
        />
      ))}
    </div>
  );
};
