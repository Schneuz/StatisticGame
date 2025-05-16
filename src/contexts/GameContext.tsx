import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Sector, sectors } from '../data/sectors';
import { PerformanceGroup } from '../models/DataGenerationModel';
import { getSectorPerformanceGroup } from '../models/SectorModel';
import { ActionTracker } from '../models/ActionTracker';

export interface PortfolioItem {
  sector: Sector;
  quantity: number;
  purchasePrice: number;
}

interface GameState {
  capital: number;
  portfolio: PortfolioItem[];
  currentPrices: Record<string, number>;
  investmentCount: number;
  timeAdvanceCount: number;
  stepsInCurrentSituation: number;
  currentSituationIndex: number;
  mistakes: number;
  lastConsultation: number;
  availableTools: string[];
  shownTools: string[];
  currentMarketSituation: string | null;
  marketSituation: {
    description: string;
    recommendedTool: string | null;
    toolDescription: string | null;
    expectedOutcome: string | null;
  };
  priceHistory: {
    [sectorName: string]: {
      prices: number[];
      timestamp: number;
    };
  };
  historyLimit: number;
  isAutoProgressPaused: boolean;
  lastAutoUpdate: number;
  showScenarioCompletionPopup: boolean;
  previousCapital: number;
}

interface MarketSituation {
  description: string;
  recommendedTool: string | null;
  toolDescription: string | null;
  performanceGroups: {
    positive: string[];  // Sector names that should perform well
    neutral: string[];   // Sector names that should perform average
    negative: string[];  // Sector names that should perform poorly
  };
  expectedOutcomes: string[];
  testCriteria: {
    threshold: number;
  };
  hypotheses: {
    statement: string;
    expected: string;
    narrativeHint: string;
  }[];
}

type GameAction =
  | { type: 'PURCHASE_SECTOR'; sector: Sector; quantity: number }
  | { type: 'SELL_SECTOR'; sectorName: string; quantity: number }
  | { type: 'UPDATE_PRICES' }
  | { type: 'ADVANCE_TIME' }
  | { type: 'ADVANCE_TO_NEXT_SCENARIO' }
  | { type: 'TOGGLE_AUTO_PROGRESS' }
  | { type: 'ADD_MISTAKE' }
  | { type: 'COMPLETE_MEETING' }
  | { type: 'MARK_TOOL_SHOWN'; tool: string }
  | { type: 'PAY_FOR_HINT'; cost: number }
  | { type: 'RESET_GAME' }
  | { type: 'CLOSE_SCENARIO_COMPLETION_POPUP' }
  | { type: 'SHOW_SCENARIO_COMPLETION_POPUP' };

export const marketSituations: MarketSituation[] = [
  {
    description: "Elrond's valley shimmers under a canopy of stars. The air in Imladris is alive with a gentle joy beneath the watchful stars. Elven voices, light as the rustling of leaves, weave through the soft glow of hearth fires, where golden mead is poured and the sweet fragrance of honeyed lembas wafts from the kitchens. In the hidden workshops, the skilled hands of Elven craftspeople move with practiced grace, preparing exquisite wares for the upcoming gathering. With each sunrise, carts laden with finely wrought goods and provisions trundle along the winding paths, destined for settlements beyond the valley. Yet, even in this haven, whispers of unease drift from the shadowed passes, and the need for vigilant sentinels along the borders grows with the lengthening of the nights.",
    recommendedTool: "T-Test",
    toolDescription: "Food & Beverages outperform Precious Metals. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Food & Beverages', 'Craftsmanship & Technology', 'Transport & Logistics', 'Medicine & Healing', 'Music & Entertainment', 'Textiles & Clothing'],
      neutral: ['Precious Metals', 'Agriculture & Livestock', 'Fishing & Seafood', 'Glassware & Mirrors', 'Horse & Riding Services'],
      negative: ['Armor & Weapons', 'Construction Materials & Resources', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Food & Beverages show a significantly higher mean return than Precious Metals.",
      "Craftsmanship & Technology have a higher proportion of positive return days than Glassware & Mirrors.",
      "Medicine & Healing have a higher proportion of positive return days than Agriculture & Livestock.",
      "No significant difference in mean return between Agriculture & Livestock and Construction Materials & Resources.",
      "Jewelry & Gems have a higher proportion of negative return days than Textiles & Clothing."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Food & Beverages is higher than the mean return of Precious Metals.",
        expected: "Higher for Food & Beverages",
        narrativeHint: "The description emphasizes the active consumption of 'golden mead' and the appealing scent of 'honeyed lembas,' indicating a high demand and turnover within the Food & Beverages sector. In contrast, while precious metals might be present in Imladris, there is no specific mention of active trading or a surge in their market, implying a less dynamic economic performance compared to the flourishing food and beverage industry in this peaceful setting."
      },
      {
        statement: "The median return of Craftsmanship & Technology is different from the median return of Glassware & Mirrors.",
        expected: "Higher for Craftsmanship",
        narrativeHint: "The narrative focuses on the 'skilled hands' of Elven artisans diligently creating 'exquisite wares' for a specific event, suggesting a high level of economic activity and value associated with their craftsmanship. The sector of Glassware & Mirrors is not explicitly mentioned or emphasized in the description of this bustling activity, implying a potentially less significant or dynamic market compared to the thriving Craftsmanship & Technology sector."
      },
      {
        statement: "The proportion of days with positive returns for Medicine & Healing is higher than for Agriculture & Livestock.",
        expected: "Higher for Medicine",
        narrativeHint: "While the 'gentle joy' suggests a healthy environment, the preparations for a 'gathering' and the movement of 'laden carts' could lead to minor accidents or ailments, creating a consistent demand for the services of healers. The neutral performance of Agriculture & Livestock suggests a steady supply but not necessarily a high frequency of positive returns compared to the anticipated consistent need for medical attention in a scenario involving travel and gatherings."
      }
    ]
  },
  {
    description: "War drums thunder across the Pelennor Fields. The very air above the wide expanse of the Pelennor vibrates with the deep, resonating beat of war drums, a sound that chills the bone and steels the heart. Within the towering walls of Minas Tirith, the urgent clang of the forge echoes through the streets as smiths labour tirelessly, shaping iron and steel for the coming conflict. In the city's halls, healers meticulously lay out stores of healing herbs and clean bandages, anticipating the grim toll of battle. The granaries, fortified against siege, are filled to their capacity as the city's inhabitants prepare for the storm. The main thoroughfares are largely deserted, save for grim-faced messengers on swift steeds, carrying tidings of war. Amidst the preparations, finely wrought trinkets and festive garments lie forgotten in the dust of market stalls, their allure lost in the shadow of impending war.",
    recommendedTool: "T-Test",
    toolDescription: "Armor & Weapons outperform Food & Beverages. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Armor & Weapons', 'Medicine & Healing', 'Construction Materials & Resources', 'Horse & Riding Services'],
      neutral: ['Precious Metals', 'Craftsmanship & Technology', 'Agriculture & Livestock', 'Fishing & Seafood', 'Textiles & Clothing', 'Glassware & Mirrors'],
      negative: ['Transport & Logistics', 'Food & Beverages', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Armor & Weapons show a significantly higher mean return than Food & Beverages.",
      "Medicine & Healing have a lower proportion of negative return days than Transport & Logistics.",
      "Agriculture & Livestock have a mean gain not significantly different from Construction Materials & Resources.",
      "Textiles & Clothing have a significantly lower median return than Precious Metals."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Armor & Weapons is higher than the mean return of Food & Beverages.",
        expected: "Higher for Armor & Weapons",
        narrativeHint: "The sounds of 'urgent clang of the forge' and the sight of smiths laboring 'tirelessly' to produce weapons directly indicate a high demand and intense activity in the Armor & Weapons sector. Conversely, the description of 'granaries... filled to their capacity' suggests a focus on stockpiling food rather than active market exchange or a surge in demand for Food & Beverages, implying a lower mean return compared to the booming arms industry in this wartime scenario."
      },
      {
        statement: "The proportion of days with negative returns for Medicine & Healing is lower than for Transport & Logistics.",
        expected: "Lower for Medicine",
        narrativeHint: "The proactive preparation of healers, 'anticipating the grim toll of battle,' suggests a consistent and crucial role for the Medicine & Healing sector in the face of inevitable casualties, likely leading to fewer negative returns. In contrast, the 'deserted' main roads highlight the significant risks and disruptions faced by the Transport & Logistics sector due to the impending war, making negative returns more probable."
      },
      {
        statement: "The mean gain of Agriculture & Livestock is not significantly different from Construction Materials & Resources.",
        expected: "No significant difference",
        narrativeHint: "Both sectors play vital roles in preparing for and enduring the siege. The filling of 'granaries' signifies the successful culmination of agricultural efforts in securing essential food supplies. Simultaneously, the focus on the 'towering walls of Minas Tirith' underscores the continuous need for construction materials to maintain and strengthen defenses. This parallel importance suggests a similar level of economic activity and gain for both Agriculture & Livestock and Construction Materials & Resources in this wartime context."
      },
      {
        statement: "The median return of Textiles & Clothing is lower than the median return of Precious Metals.",
        expected: "Lower for Textiles",
        narrativeHint: "In the face of imminent war, the priorities shift towards essential goods and security. The 'forgotten' textiles and festive garments in the market stalls illustrate a decline in demand for non-essential items. Conversely, precious metals often serve as a reliable store of value and a medium of exchange during uncertain times, allowing them to maintain or even increase their worth relative to less critical goods like textiles and clothing."
      }
    ]
  },
  {
    description: "An unrelenting sun scorches Rohan's Eastfold. A brazen sun beats down with relentless fury upon the Eastfold of Rohan, baking the once fertile land until the very earth cracks and dust devils dance across the horizon. The wells have long since yielded their last drop, and the verdant fields, once rippling with grain, are now brittle and brown, offering no sustenance. The once-proud herds of horses and cattle are gaunt and few, their ribs showing beneath their parched hides. Across the desolate landscape, stonemasons and well-diggers, their faces grim with determination, seek what little work remains, their skills desperately needed. In the scattered settlements, healers, their knowledge taxed to its limit, brew what meager remedies they can against the fevers and sickness that grip the weakened populace.",
    recommendedTool: "T-Test",
    toolDescription: "Construction Materials & Resources outperform Agriculture & Livestock. Use T-Test to verify.",
    performanceGroups: {
      positive: ['Construction Materials & Resources', 'Medicine & Healing'],
      neutral: ['Precious Metals', 'Craftsmanship & Technology', 'Transport & Logistics', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Food & Beverages', 'Agriculture & Livestock', 'Armor & Weapons', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Construction Materials & Resources have a significantly higher median return than Agriculture & Livestock.",
      "Medicine & Healing have a higher proportion of positive return days than Food & Beverages.",
      "Precious Metals have a lower proportion of high-volatility days than Transport & Logistics.",
      "No significant difference in mean gain between Craftsmanship & Technology and Exploration & Cartography.",
      "Armor & Weapons have a higher proportion of loss days than Jewelry & Gems."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The median return of Construction Materials & Resources is higher than the median return of Agriculture & Livestock.",
        expected: "Higher for Construction",
        narrativeHint: "The severe drought has rendered the agricultural sector unproductive, with 'brittle and brown' fields offering 'no sustenance,' indicating a near-zero or negative return. In contrast, the skills of 'stonemasons and well-diggers' are 'desperately needed' to find alternative water sources and potentially build more resilient structures, signifying a higher demand and thus a higher median return for the Construction Materials & Resources sector."
      },
      {
        statement: "The proportion of days with positive returns for Medicine & Healing is higher than for Food & Beverages.",
        expected: "Higher for Medicine",
        narrativeHint: "The widespread 'fevers and sickness' resulting from the drought create a constant and urgent demand for the services of healers and their limited remedies, leading to a higher proportion of days with positive returns for the Medicine & Healing sector. The drying up of 'wells' and the failure of the fields directly and severely impact the availability of food and beverages, likely causing prolonged negative returns for that sector."
      },
      {
        statement: "The proportion of days exceeding a predefined volatility threshold for Precious Metals is lower than for Transport & Logistics.",
        expected: "Higher volatility for Transport",
        narrativeHint: "The extreme heat and lack of water make travel across the 'cracked earth' highly dangerous and unreliable, leading to frequent disruptions and thus significant volatility in the Transport & Logistics sector. Precious metals, not directly tied to the immediate physical challenges of the drought, are likely to maintain a more stable value, resulting in lower volatility compared to the difficulties of transportation."
      },
      {
        statement: "The proportion of days with losses for Armor & Weapons is higher than for Jewelry & Gems.",
        expected: "Higher losses for Armor",
        narrativeHint: "The decimation of horse and cattle herds due to the drought severely limits the resources available for military endeavors, directly reducing the demand and profitability of Armor & Weapons, thus increasing the proportion of days with losses. While Jewelry & Gems are not essential in this crisis, they might still retain some value as tradable commodities or personal assets, potentially experiencing fewer days of complete loss compared to the significantly impacted arms industry."
      }
    ]
  },
  {
    description: "Deep in Moria's shadows, new Mithril veins gleam. From the echoing depths of Moria, a whisper, swift as a shadow, spreads through the dwarven halls and beyond: new veins of pure Mithril, the precious metal of legend, have been unearthed in the deepest chasms. Swift messengers, their faces alight with excitement, are dispatched over the treacherous mountain passes, carrying news of the discovery. Makeshift camps of eager prospectors, their tools glinting in the dim light, and shrewd investors, their eyes gleaming with avarice, sprout like hardy weeds outside the East Gate. The price of precious metals in all the lands soars to unprecedented heights, fueled by the promise of untold riches.",
    recommendedTool: "T-Test",
    toolDescription: "Precious Metals outperform Jewelry & Gems. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Precious Metals', 'Craftsmanship & Technology', 'Transport & Logistics', 'Glassware & Mirrors'],
      neutral: ['Construction Materials & Resources', 'Food & Beverages', 'Medicine & Healing', 'Agriculture & Livestock', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services'],
      negative: ['Armor & Weapons', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Precious Metals show a significantly higher mean return than Jewelry & Gems.",
      "Jewelry & Gems have a higher proportion of high-volatility days than Craftsmanship & Technology.",
      "Transport & Logistics have a higher proportion of positive return days than Agriculture & Livestock.",
      "Glassware & Mirrors have a significantly higher mean return than Food & Beverages.",
      "Medicine & Healing have a higher proportion of negative return days than Construction Materials & Resources."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Precious Metals is higher than the mean return of Jewelry & Gems.",
        expected: "Higher for Precious Metals",
        narrativeHint: "The discovery of 'new veins of pure Mithril' and the subsequent surge in the 'price of precious metals' across the land clearly point to a significant increase in the mean return for the Precious Metals sector. The narrative does not suggest a similar positive impact on Jewelry & Gems, and the focus on the raw material might even temporarily overshadow the market for finished jewelry, implying a lower mean return for that sector."
      },
      {
        statement: "The proportion of days with positive returns for Transport & Logistics is higher than for Agriculture & Livestock.",
        expected: "Higher for Transport",
        narrativeHint: "The urgent need to disseminate news of the Mithril discovery and the subsequent influx of 'eager prospectors' and 'shrewd investors' traveling to Moria create a significant demand for Transport & Logistics services, leading to a higher proportion of days with positive returns. The Agriculture & Livestock sector is not directly impacted by this event and is listed as neutral, implying a steady but not necessarily positive performance compared to the booming transportation sector."
      },
      {
        statement: "The mean return of Glassware & Mirrors is higher than the mean return of Food & Beverages.",
        expected: "Higher for Glassware",
        narrativeHint: "The anticipation of wealth and prosperity associated with the Mithril discovery is likely to drive increased spending on non-essential luxury goods. Fine glassware and mirrors, often seen as symbols of wealth and status, would likely experience a surge in demand as individuals and communities celebrate their newfound potential riches, leading to a higher mean return compared to the more stable market for essential goods like Food & Beverages."
      },
      {
        statement: "The proportion of days with negative returns for Medicine & Healing is higher than for Construction Materials & Resources.",
        expected: "Higher negatives for Medicine",
        narrativeHint: "The influx of prospectors into the harsh and dangerous environment of Moria, with its 'treacherous mountain passes' and 'makeshift camps,' is likely to lead to numerous accidents and illnesses. The limited medical resources available might become overwhelmed, resulting in a higher proportion of days with negative returns for the Medicine & Healing sector due to the inability to effectively treat all those in need. The demand for Construction Materials & Resources to build and maintain the camps is likely to be more consistent and less prone to negative returns."
      }
    ]
  },
  {
    description: "Black longships loom at the mouth of the Anduin. Like monstrous shadows against the grey dawn, black longships, bearing the mark of the corsairs, appear at the mouth of the great river Anduin. A wave of fear washes over the coastal settlements as the raiders descend, their cries echoing across the water. Stores of wine and grain are plundered, valuable iron is seized and carelessly cast into the depths, and homes are put to the torch. Overland routes become choked with fearful travelers seeking refuge inland, and wagon drivers, wary of ambush along every bend, demand exorbitant hazard pay for their services, if they dare to travel at all.",
    recommendedTool: "T-Test",
    toolDescription: "Armor & Weapons outperform Transport & Logistics. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Armor & Weapons', 'Craftsmanship & Technology', 'Medicine & Healing', 'Construction Materials & Resources'],
      neutral: ['Precious Metals', 'Agriculture & Livestock', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Transport & Logistics', 'Food & Beverages', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Armor & Weapons show a significantly higher mean return than Transport & Logistics.",
      "Exploration & Cartography have a higher proportion of high-volatility days than Precious Metals.",
      "Craftsmanship & Technology have a higher proportion of positive return days than Food & Beverages.",
      "No significant difference in mean return between Medicine & Healing and Construction Materials & Resources.",
      "Agriculture & Livestock have a higher proportion of negative return days than Jewelry & Gems."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Armor & Weapons is higher than the mean return of Transport & Logistics.",
        expected: "Higher for Armor",
        narrativeHint: "The violent raids on coastal settlements and the destruction of homes create an immediate and pressing need for defensive measures and weaponry, leading to a significant increase in demand and thus a higher mean return for the Armor & Weapons sector. Conversely, the 'choked' overland routes and the high risk of ambush severely disrupt travel and trade, causing a decline in activity and a lower mean return, potentially even negative, for the Transport & Logistics sector."
      },
      {
        statement: "The proportion of days with negative returns for Exploration & Cartography is higher than for Precious Metals.",
        expected: "Higher negatives for Exploration & Cartography",
        narrativeHint: "The hostile raids create an extremely unstable and dangerous environment, making attempts at Exploration & Cartography highly perilous and likely to result in frequent failures or negative outcomes. Precious metals, while affected by unrest, are not directly exposed to these physical dangers and would likely see fewer days with negative returns."
      },
      {
        statement: "The proportion of days with positive returns for Craftsmanship & Technology is higher than for Food & Beverages.",
        expected: "Higher for Craftsmanship",
        narrativeHint: "The act of the raiders seizing and discarding 'valuable iron' creates a demand for replacements, stimulating the Craftsmanship & Technology sector as blacksmiths and other artisans are needed to forge new tools and weapons. At the same time, the plundering of 'stores of wine and grain' directly reduces the availability of food and beverages, leading to shortages and negative returns for that sector."
      },
      {
        statement: "The proportion of days with negative returns for Agriculture & Livestock is higher than for Jewelry & Gems.",
        expected: "Higher negatives for Agriculture",
        narrativeHint: "The plundering of 'stores of wine and grain' directly and immediately impacts the available food supply, which is closely linked to the performance of the Agriculture & Livestock sector. The disruption caused by the raids and the fear of further attacks could also hinder ongoing agricultural activities and the tending of livestock, leading to a higher proportion of days with negative returns. While some jewelry and gems might be lost or stolen during the raids, the overall impact on the market for these goods is likely less direct and immediate compared to the disruption of the food supply chain."
      }
    ]
  },
  {
    description: "A new sapling of the White Tree blossoms in Minas Tirith's courtyard. A hush falls over the White City, broken only by murmurs of awe and reverence, as a new sapling of the White Tree, symbol of hope and kingship, unfurls its delicate, emerald leaves in the very heart of the Citadel courtyard. Pilgrims from every corner of Gondor and beyond, their hearts filled with devotion, flock to Minas Tirith to witness this blessed miracle, their numbers swelling the city's streets to overflowing. Every inn and lodging house is packed to capacity, and vendors eagerly sell silver amulets bearing the image of the White Tree, crafted in haste to meet the sudden demand.",
    recommendedTool: "T-Test",
    toolDescription: "Food & Beverages outperform Armor & Weapons. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Food & Beverages', 'Craftsmanship & Technology', 'Medicine & Healing', 'Agriculture & Livestock', 'Music & Entertainment', 'Textiles & Clothing'],
      neutral: ['Precious Metals', 'Transport & Logistics', 'Construction Materials & Resources', 'Fishing & Seafood', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Armor & Weapons', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Food & Beverages show a significantly higher mean return than Armor & Weapons.",
      "Craftsmanship & Technology have a higher proportion of high-volatility days than Precious Metals.",
      "Medicine & Healing have a higher proportion of positive return days than Transport & Logistics.",
      "No significant difference in mean return between Construction Materials & Resources and Exploration & Cartography.",
      "Jewelry & Gems have a higher proportion of negative return days than Agriculture & Livestock."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Food & Beverages is higher than the mean return of Armor & Weapons.",
        expected: "Higher for Food",
        narrativeHint: "The massive influx of pilgrims to Minas Tirith, resulting in 'every inn and lodging house' being 'packed to capacity,' creates a significant surge in demand for food and beverages, driving up the mean return for that sector. The blossoming of the White Tree is a joyous and peaceful occasion, leading to a low demand for military goods and thus a lower mean return for Armor & Weapons."
      },
      {
        statement: "The proportion of days with positive returns for Craftsmanship & Technology is higher than for Precious Metals.",
        expected: "Higher for Craftsmanship & Technology",
        narrativeHint: "The 'sudden demand' for 'silver amulets bearing the image of the White Tree' means craftspeople are working to meet pilgrim needs, likely leading to a higher proportion of days with positive returns for Craftsmanship & Technology. Precious Metals, while used in amulets, have a neutral outlook and might not see the same consistent positive return frequency."
      },
      {
        statement: "The proportion of days with positive returns for Medicine & Healing is higher than for Transport & Logistics.",
        expected: "Higher for Medicine",
        narrativeHint: "The mass movement of 'pilgrims from every corner of Gondor and beyond' traveling to Minas Tirith increases the likelihood of travelers encountering illnesses or injuries along their journey, creating a sustained demand for medical services upon their arrival. While the Transport & Logistics sector will also experience increased activity due to the influx of people, the continuous need for medical attention for a large gathering might lead to a higher proportion of days with positive returns for Medicine & Healing."
      },
      {
        statement: "The proportion of days with negative returns for Jewelry & Gems is higher than for Agriculture & Livestock.",
        expected: "Higher negatives for Jewelry",
        narrativeHint: "The sudden surge in demand for and production of 'silver amulets bearing the image of the White Tree' is likely to saturate the market for commemorative items, potentially diminishing the appeal and value of more traditional and expensive jewelry, leading to a higher proportion of days with negative returns for the Jewelry & Gems sector. The positive performance of Agriculture & Livestock suggests a strong demand for food to feed the large number of pilgrims, likely resulting in fewer negative returns for that sector."
      }
    ]
  },
  {
    description: "In the deep green of Fangorn, the Ents forbid the felling of any living wood. A profound stillness descends upon the edges of Fangorn Forest, broken only by the rustling of leaves and the deep, resonant voices of the ancient Ents. A decree, echoing with the weight of centuries, reverberates through the lands of Men and Dwarves: the felling of any living tree within Fangorn's verdant domain is henceforth forbidden. The price of timber in the markets of Rohan and Eriador plummets as existing stocks flood the market, but stonemasons find themselves in sudden and considerable demand as builders seek alternative materials. Meanwhile, the fertile fields bordering the forest yield a particularly bountiful harvest, perhaps in defiance of the disruption.",
    recommendedTool: "T-Test",
    toolDescription: "Construction Materials & Resources rise because farmers build extra storage halls. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Construction Materials & Resources', 'Agriculture & Livestock', 'Medicine & Healing', 'Armor & Weapons', 'Textiles & Clothing'],
      neutral: ['Precious Metals', 'Craftsmanship & Technology', 'Transport & Logistics', 'Fishing & Seafood', 'Horse & Riding Services', 'Glassware & Mirrors'],
      negative: ['Food & Beverages', 'Music & Entertainment', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Construction Materials & Resources have a mean return significantly greater than zero.",
      "Agriculture & Livestock have a lower proportion of high-volatility days than Jewelry & Gems.",
      "Medicine & Healing have a higher proportion of positive return days than Food & Beverages.",
      "No significant difference in mean return between Exploration & Cartography and Precious Metals.",
      "Transport & Logistics have a higher proportion of loss days than Armor & Weapons."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The proportion of days with positive returns for Agriculture & Livestock is higher than the proportion of days with positive returns for Food & Beverages.",
        expected: "Higher for Agriculture & Livestock",
        narrativeHint: "The 'particularly bountiful harvest' strongly suggests positive performance for the Agriculture & Livestock sector, leading to a higher likelihood of positive return days. The Food & Beverages sector, potentially reliant on resources or trade routes connected to the now forbidden Fangorn, is listed as negative and would likely experience fewer days with positive returns due to these disruptions."
      },
      {
        statement: "The median return of Construction Materials & Resources is higher than the median return of Craftsmanship & Technology that used wood.",
        expected: "Higher for Construction Materials & Resources",
        narrativeHint: "The increased demand for alternative building materials directly lifts the Construction Materials & Resources sector. Conversely, any part of the Craftsmanship & Technology sector that traditionally relied on wood from Fangorn would face supply chain disruptions due to the ban, likely resulting in a lower median return compared to the booming Construction Materials & Resources."
      },
      {
        statement: "The proportion of days with positive returns for Medicine & Healing is higher than for Food & Beverages.",
        expected: "Higher for Medicine",
        narrativeHint: "The prohibition on felling trees in Fangorn could restrict access to certain traditional medicinal herbs and resources, potentially driving demand for alternative remedies and the expertise of healers who possess knowledge of these alternatives, thus leading to a higher proportion of days with positive returns for the Medicine & Healing sector. The negative impact on Food & Beverages might stem from the disruption of traditional foraging practices within the forest or changes in trade routes that previously relied on forest products."
      },
      {
        statement: "The proportion of days with losses for Transport & Logistics is higher than for Armor & Weapons.",
        expected: "Higher losses for Transport",
        narrativeHint: "The closure of Fangorn Forest to logging and potentially to passage disrupts established trade routes that previously relied on this area, leading to difficulties and potential losses for the Transport & Logistics sector. The positive performance of Armor & Weapons might be attributed to increased demand for protection in response to the economic and social disruptions caused by the Ents' decree, potentially leading to fewer instances of losses in that sector compared to the transportation industry."
      }
    ]
  },
  {
    description: "Deep inside a rocky cavern, goblin torches flicker over raw gemstones. In the echoing depths of a vast, rocky cavern, the flickering, greasy light of goblin torches casts long, dancing shadows over a chaotic scene. Heaps of raw gemstones, their facets catching the dim light, lie scattered alongside bubbling concoctions of dubious origin and strange devices of ticking gears and unknown purpose. Traders, brave or foolish, venture into this subterranean market, haggling fiercely with the goblin denizens and paying hefty tolls to crude gatekeepers for passage. Precious metals, mined from the very rock of the cavern, gleam dully under the torchlight, a testament to the riches hidden within this perilous place.",
    recommendedTool: "T-Test",
    toolDescription: "Precious Metals outperform Agriculture & Livestock. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Precious Metals', 'Transport & Logistics', 'Construction Materials & Resources', 'Glassware & Mirrors'],
      neutral: ['Armor & Weapons', 'Craftsmanship & Technology', 'Fishing & Seafood', 'Textiles & Clothing', 'Horse & Riding Services', 'Music & Entertainment'],
      negative: ['Food & Beverages', 'Agriculture & Livestock', 'Medicine & Healing', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Precious Metals show a significantly higher mean return than Agriculture & Livestock.",
      "Jewelry & Gems have a higher proportion of high-volatility days than Craftsmanship & Technology.",
      "Transport & Logistics have a higher proportion of positive return days than Exploration & Cartography.",
      "No significant difference in mean gain between Construction Materials & Resources and Armor & Weapons.",
      "Medicine & Healing have a higher proportion of negative return days than Food & Beverages."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Precious Metals is higher than the mean return of Agriculture & Livestock.",
        expected: "Higher for Precious Metals",
        narrativeHint: "The description explicitly states that 'precious metals' are being 'mined from the very rock of the cavern,' indicating a direct source and likely a positive mean return for that sector. The subterranean environment of the rocky cavern offers no arable land or grazing areas, making Agriculture & Livestock impossible within this setting, thus resulting in a significantly lower, likely negative or zero, mean return for that sector."
      },
      {
        statement: "The proportion of days with negative returns for Jewelry & Gems is higher than for Craftsmanship & Technology.",
        expected: "Higher negatives for Jewelry & Gems",
        narrativeHint: "The 'heaps of raw gemstones' in a chaotic goblin market suggest an unstable supply and risky transactions for Jewelry & Gems, leading to a higher proportion of days with negative returns. Craftsmanship & Technology, while present with 'strange devices', is neutral and likely more stable than the volatile raw gemstone trade."
      },
      {
        statement: "The proportion of days with positive returns for Transport & Logistics is higher than for Exploration & Cartography.",
        expected: "Higher for Transport",
        narrativeHint: "The narrative explicitly mentions 'traders' venturing into the cavern and 'paying hefty tolls for passage,' indicating an active flow of goods and people and thus positive returns for the Transport & Logistics sector. The perilous and secretive nature of the goblin market would likely discourage formal Exploration & Cartography, leading to fewer opportunities for positive returns in that sector."
      },
      {
        statement: "The proportion of days with negative returns for Medicine & Healing is higher than for Food & Beverages.",
        expected: "Higher negatives for Medicine",
        narrativeHint: "The availability of 'bubbling concoctions of dubious origin' in the goblin market strongly suggests that the remedies offered might be ineffective or even harmful, leading to a higher proportion of days with negative returns for the Medicine & Healing sector. While the Food & Beverages sector is also negative, the description doesn't explicitly portray them as dangerous, implying that the negative returns might stem from scarcity or poor quality rather than actively harmful products, thus potentially resulting in fewer days with negative outcomes compared to the unreliable medical offerings."
      }
    ]
  },
  {
    description: "By flickering torchlight, a Dwarf King and an Elf Lord forge an alliance. Under the warm glow of flickering torches held aloft by dwarven and elven attendants, a momentous pact is sealed as a Dwarf King, his beard richly adorned with gems, clasps hands in alliance with an Elf Lord, his eyes reflecting ancient wisdom. The great halls ring with the promise of future trade: finely cut gemstones from the depths of the mountains exchanged for shimmering Elven silks, and the unmatched steel of dwarven blades offered in return for the delicate beauty of crystal Elven harps. Artisans and glassblowers in both realms rejoice at the prospect of new markets and the exchange of skills and artistry.",
    recommendedTool: "T-Test",
    toolDescription: "Craftsmanship & Technology outperform Armor & Weapons. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Craftsmanship & Technology', 'Precious Metals', 'Textiles & Clothing', 'Glassware & Mirrors', 'Music & Entertainment'],
      neutral: ['Transport & Logistics', 'Medicine & Healing', 'Construction Materials & Resources', 'Fishing & Seafood', 'Agriculture & Livestock', 'Horse & Riding Services'],
      negative: ['Armor & Weapons', 'Food & Beverages', 'Jewelry & Gems', 'Exploration & Cartography']
    },
    expectedOutcomes: [
      "Craftsmanship & Technology show a significantly higher mean return than Armor & Weapons.",
      "Precious Metals have a lower proportion of high-volatility days than Exploration & Cartography.",
      "Jewelry & Gems have a higher proportion of positive return days than Construction Materials & Resources.",
      "No significant difference in mean return between Transport & Logistics and Food & Beverages.",
      "Agriculture & Livestock have a higher proportion of negative return days than Medicine & Healing."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Craftsmanship & Technology is higher than the mean return of Armor & Weapons.",
        expected: "Higher for Craftsmanship",
        narrativeHint: "The explicit rejoicing of 'artisans and glassblowers' at the 'prospect of new markets and the exchange of skills and artistry' clearly signals a positive future for the Craftsmanship & Technology sector as a result of the alliance. The forging of an alliance between the Dwarf King and the Elf Lord implies a period of peace and cooperation, which would likely lead to a decrease in demand for weapons and thus a lower mean return for the Armor & Weapons sector."
      },
      {
        statement: "The proportion of days with positive returns for Jewelry & Gems is higher than for Construction Materials & Resources.",
        expected: "Higher for Jewelry",
        narrativeHint: "The explicit mention of 'finely cut gemstones' being exchanged as a central element of the alliance signifies a strong and active market for these precious items, which are a primary component of the Jewelry & Gems sector, suggesting a higher proportion of days with positive returns. The Construction Materials & Resources sector is listed as neutral, implying a steady level of activity but not necessarily a surge in demand comparable to the trade in gemstones."
      },
      {
        statement: "The proportion of days with negative returns for Agriculture & Livestock is higher than for Medicine & Healing.",
        expected: "Higher negatives for Agriculture",
        narrativeHint: "The emphasis on the exchange of high-value crafted goods like 'shimmering Elven silks' might lead to a decrease in demand for more basic, locally produced textiles, potentially negatively impacting the Agriculture & Livestock sector if wool or other agricultural products are key components of local textile production. The Medicine & Healing sector is listed as neutral, suggesting that the alliance does not have any immediate negative consequences for it, thus making negative returns less likely compared to the potentially affected agricultural sector."
      }
    ]
  },
  {
    description: "Dense mists swallowed Bree's alleys. A thick, swirling mist, cold and clammy, descends with an unnatural swiftness upon the town of Bree, swallowing its winding alleys and cobbled streets in an eerie, disorienting silence. Out of the gloom, strangers, cloaked and mysterious, arrive in the common-room of the Prancing Pony, their purses heavy with coin as they discreetly inquire about lodgings and stables. The rhythmic clang of the blacksmith's hammer rings out through the fog as he works feverishly, selling sturdy locks and iron bars faster than he can forge them. Whispers of shadowy figures and stolen goods slither through the darkened, mist-laden streets, fueling a sense of unease and suspicion.",
    recommendedTool: "T-Test",
    toolDescription: "Exploration & Cartography outperform Food & Beverages. Use a T-Test to verify.",
    performanceGroups: {
      positive: ['Exploration & Cartography', 'Armor & Weapons', 'Construction Materials & Resources', 'Horse & Riding Services', 'Craftsmanship & Technology'],
      neutral: ['Precious Metals', 'Transport & Logistics', 'Fishing & Seafood', 'Textiles & Clothing', 'Medicine & Healing', 'Glassware & Mirrors'],
      negative: ['Food & Beverages', 'Agriculture & Livestock', 'Music & Entertainment', 'Jewelry & Gems']
    },
    expectedOutcomes: [
      "Exploration & Cartography show a significantly higher mean return than Food & Beverages.",
      "Armor & Weapons have a higher proportion of high-volatility days than Transport & Logistics.",
      "Construction Materials & Resources have a higher proportion of positive return days than Agriculture & Livestock.",
      "No significant difference in mean return between Craftsmanship & Technology and Precious Metals.",
      "Jewelry & Gems have a higher proportion of negative return days than Medicine & Healing."
    ],
    testCriteria: {
      threshold: 0.05,
    },
    hypotheses: [
      {
        statement: "The mean return of Exploration & Cartography is higher than the mean return of Food & Beverages.",
        expected: "Higher for Exploration",
        narrativeHint: "The sudden descent of a 'thick, swirling mist' that obscures the town of Bree creates an immediate need for guidance and maps to navigate the disorienting environment, thus driving up the demand and mean return for the Exploration & Cartography sector. The unsettling atmosphere caused by the mist and the arrival of 'cloaked and mysterious' strangers could disrupt the normal routines and trade of food and beverages, potentially leading to a lower mean return for that sector."
      },
      {
        statement: "The proportion of days with positive returns for Construction Materials & Resources is higher than for Agriculture & Livestock.",
        expected: "Higher for Construction",
        narrativeHint: "The arrival of 'strangers' with 'heavy purses' seeking 'lodgings and stables' indicates a potential increase in demand for renovations, repairs, and possibly new construction to accommodate them, leading to more positive returns for the Construction Materials & Resources sector. The dense mist and the unsettling presence of unknown individuals could disrupt farming activities and the movement of livestock, potentially leading to fewer positive returns for the Agriculture & Livestock sector."
      },
      {
        statement: "The proportion of days with positive returns for Horse & Riding Services is higher than for Food & Beverages.",
        expected: "Higher for Horse & Riding Services",
        narrativeHint: "The arrival of 'strangers... inquire about lodgings and stables' directly points to increased demand for stabling, a key component of Horse & Riding Services. The unsettling mist and the arrival of mysterious figures could disrupt the normal flow of trade and consumption of food and beverages, potentially leading to fewer positive return days for that sector."
      },
      {
        statement: "The median return of Craftsmanship & Technology (specifically blacksmithing) is higher than the median return of Jewelry & Gems.",
        expected: "Higher for Craftsmanship & Technology",
        narrativeHint: "The blacksmith's 'feverishly' working to meet the high demand for 'sturdy locks and iron bars' indicates a strong positive performance for this specific area of Craftsmanship & Technology. The 'whispers of shadowy figures and stolen goods' suggest a risky environment for valuable items like jewelry, potentially lowering the median return for Jewelry & Gems."
      }
    ]
  }
];

const initialState: GameState = {
  capital: 10000,
  portfolio: [],
  currentPrices: {},
  investmentCount: 0,
  timeAdvanceCount: 0,
  stepsInCurrentSituation: 0,
  currentSituationIndex: 0,
  mistakes: 0,
  lastConsultation: 0,
  availableTools: ['T-Test', 'Chi-Square'],
  shownTools: [],
  currentMarketSituation: null,
  marketSituation: {
    description: marketSituations[0].description,
    recommendedTool: marketSituations[0].recommendedTool,
    toolDescription: marketSituations[0].toolDescription,
    expectedOutcome: marketSituations[0].expectedOutcomes[0]
  },
  priceHistory: {},
  historyLimit: 10,
  isAutoProgressPaused: true,
  lastAutoUpdate: 0,
  showScenarioCompletionPopup: false,
  previousCapital: 10000
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

function generateNewPrice(currentPrice: number, performanceGroup: PerformanceGroup): number {
  // Different random ranges based on performance group
  let minChange, maxChange;
  switch (performanceGroup) {
    case 'positive':
      minChange = 0.02;  // +2% to +8%
      maxChange = 0.08;
      break;
    case 'negative':
      minChange = -0.08; // -8% to -2%
      maxChange = -0.02;
      break;
    default: // neutral
      minChange = -0.03; // -3% to +3%
      maxChange = 0.03;
  }

  const changePercent = minChange + Math.random() * (maxChange - minChange);
  const newPrice = currentPrice * (1 + changePercent);
  return Math.round(newPrice * 100) / 100;
}

// Optimierte Hilfsfunktionen für Statistikberechnungen
function calculateMean(numbers: number[]): number {
  let sum = 0;
  const len = numbers.length;
  for (let i = 0; i < len; i++) {
    sum += numbers[i];
  }
  return sum / len;
}

function calculateStandardDeviation(numbers: number[], mean: number): number {
  let sumSquareDiff = 0;
  const len = numbers.length;
  for (let i = 0; i < len; i++) {
    sumSquareDiff += (numbers[i] - mean) ** 2;
  }
  return Math.sqrt(sumSquareDiff / len);
}

// Optimierte T-Test Funktion
function performTTest(group1: number[], group2: number[]): number {
  if (group1.length < 2 || group2.length < 2) return 1;

  const mean1 = calculateMean(group1);
  const mean2 = calculateMean(group2);
  const sd1 = calculateStandardDeviation(group1, mean1);
  const sd2 = calculateStandardDeviation(group2, mean2);
  
  if (sd1 === 0 && sd2 === 0) return 1;
  
  const n1 = group1.length;
  const n2 = group2.length;
  
  const pooledStandardError = Math.sqrt((sd1 * sd1 / n1) + (sd2 * sd2 / n2));
  if (pooledStandardError === 0) return 1;
  
  const tStatistic = Math.abs(mean1 - mean2) / pooledStandardError;
  return 1 / (1 + Math.exp(0.717 * tStatistic));
}

// Optimierte Chi-Square Test Funktion
function performChiSquareTest(observed: number[][], expected: number[][]): number {
  let chiSquare = 0;
  const rows = observed.length;
  const cols = observed[0].length;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (expected[i][j] !== 0) {
        const diff = observed[i][j] - expected[i][j];
        chiSquare += (diff * diff) / expected[i][j];
      }
    }
  }
  
  return 1 / (1 + Math.exp(0.717 * chiSquare));
}

// Helper function to calculate total portfolio value consistently
const calculateTotalPortfolioValue = (portfolio: Array<{ sector: Sector; quantity: number }>, capital: number, currentPrices: Record<string, number>) => {
  const holdingsValue = portfolio.reduce((total, item) => {
    const currentPrice = currentPrices[item.sector.name] || item.sector.currentPrice;
    return total + (currentPrice * item.quantity);
  }, 0);
  
  const totalValue = holdingsValue + capital;
  return Math.round(totalValue * 100) / 100;
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PURCHASE_SECTOR': {
      const totalCost = action.sector.currentPrice * action.quantity;
      if (totalCost > state.capital) {
        return state;
      }

      const existingItem = state.portfolio.find(item => item.sector.name === action.sector.name);
      const newPortfolio = existingItem
        ? state.portfolio.map(item =>
            item.sector.name === action.sector.name
              ? {
                  ...item,
                  quantity: item.quantity + action.quantity,
                  purchasePrice: (item.purchasePrice * item.quantity + action.sector.currentPrice * action.quantity) / (item.quantity + action.quantity)
                }
              : item
          )
        : [...state.portfolio, { sector: action.sector, quantity: action.quantity, purchasePrice: action.sector.currentPrice }];

      return {
        ...state,
        capital: state.capital - totalCost,
        portfolio: newPortfolio,
        investmentCount: state.investmentCount + 1
      };
    }

    case 'SELL_SECTOR': {
      const portfolioItem = state.portfolio.find(item => item.sector.name === action.sectorName);
      if (!portfolioItem || portfolioItem.quantity < action.quantity) {
        return state;
      }

      const saleValue = portfolioItem.sector.currentPrice * action.quantity;
      const newPortfolio = portfolioItem.quantity === action.quantity
        ? state.portfolio.filter(item => item.sector.name !== action.sectorName)
        : state.portfolio.map(item =>
            item.sector.name === action.sectorName
              ? { ...item, quantity: item.quantity - action.quantity }
              : item
          );

      return {
        ...state,
        capital: state.capital + saleValue,
        portfolio: newPortfolio
      };
    }

    case 'UPDATE_PRICES': {
      // Optimiere Preis-Updates durch Vermeidung unnötiger Objektkopien
      const updatedPortfolio = state.portfolio.map(item => ({
        ...item,
        sector: {
          ...item.sector,
          currentPrice: Number((state.currentPrices[item.sector.name] || item.sector.currentPrice).toFixed(2))
        }
      }));

      return {
        ...state,
        portfolio: updatedPortfolio
      };
    }

    case 'TOGGLE_AUTO_PROGRESS':
      return {
        ...state,
        isAutoProgressPaused: !state.isAutoProgressPaused,
        lastAutoUpdate: Date.now()
      };

    case 'ADVANCE_TIME': {
      const newTimeAdvanceCount = state.timeAdvanceCount + 1;
      const newStepsInCurrentSituation = state.stepsInCurrentSituation + 1;
      
      // Only update prices if we're not in auto-progress mode or if it's been long enough
      const shouldUpdatePrices = !state.isAutoProgressPaused || 
        (Date.now() - state.lastAutoUpdate) >= 1000;
      
      if (shouldUpdatePrices) {
        // Update prices for all sectors
        const newPrices = { ...state.currentPrices };
        sectors.forEach(sector => {
          const performanceGroup = getSectorPerformanceGroup(sector.name, state.currentSituationIndex);
          newPrices[sector.name] = generateNewPrice(sector.currentPrice, performanceGroup);
          sector.currentPrice = newPrices[sector.name];
        });
        
        // Update price history
        const newPriceHistory = { ...state.priceHistory };
        sectors.forEach(sector => {
          if (!newPriceHistory[sector.name]) {
            newPriceHistory[sector.name] = { 
              prices: [], 
              timestamp: Date.now() 
            };
          }
          newPriceHistory[sector.name].prices.push(newPrices[sector.name]);
          if (newPriceHistory[sector.name].prices.length > state.historyLimit) {
            newPriceHistory[sector.name].prices.shift();
          }
        });
        
        return {
          ...state,
          currentPrices: newPrices,
          priceHistory: newPriceHistory,
          timeAdvanceCount: newTimeAdvanceCount,
          stepsInCurrentSituation: newStepsInCurrentSituation,
          lastAutoUpdate: Date.now()
        };
      }
      
      return {
        ...state,
        timeAdvanceCount: newTimeAdvanceCount,
        stepsInCurrentSituation: newStepsInCurrentSituation
      };
    }

    case 'ADD_MISTAKE':
      return {
        ...state,
        mistakes: state.mistakes + 1
      };

    case 'COMPLETE_MEETING':
      const meetingUnlockedTools: string[] = [];
      if (state.mistakes >= 3 && !state.availableTools.includes('T-Test')) {
        meetingUnlockedTools.push('T-Test');
      }
      if (state.mistakes >= 9 && !state.availableTools.includes('Chi-Square Test')) {
        meetingUnlockedTools.push('Chi-Square Test');
      }

      return {
        ...state,
        mistakes: 0,
        availableTools: [...state.availableTools, ...meetingUnlockedTools],
        // Don't include newly unlocked tools in shownTools yet
        shownTools: state.shownTools.filter(tool => !meetingUnlockedTools.includes(tool))
      };

    case 'MARK_TOOL_SHOWN':
      return {
        ...state,
        shownTools: [...state.shownTools, action.tool]
      };

    case 'PAY_FOR_HINT': {
      if (action.cost > state.capital) {
        return state;
      }
      
      return {
        ...state,
        capital: state.capital - action.cost
      };
    }

    case 'RESET_GAME':
      return {
        ...initialState,
        availableTools: state.availableTools,  // Preserve unlocked tools
        shownTools: state.shownTools,  // Preserve shown tools history
        currentMarketSituation: null
      };

    case 'CLOSE_SCENARIO_COMPLETION_POPUP': {
      const totalValue = calculateTotalPortfolioValue(state.portfolio, state.capital, state.currentPrices);
      
      console.log('Closing scenario popup. Detailed calculation:');
      console.log('Setting previousCapital for next scenario to:', totalValue);
      
      return {
        ...state,
        showScenarioCompletionPopup: false,
        previousCapital: totalValue
      };
    }

    case 'ADVANCE_TO_NEXT_SCENARIO': {
      const newSituationIndex = state.currentSituationIndex + 1;
      if (newSituationIndex >= marketSituations.length) {
        return state; // Don't advance if we're at the end
      }
      
      // Update the market situation index without using global state
      const newMarketSituation = marketSituations[newSituationIndex];
      
      // Füge Log hinzu, um den Start eines neuen Szenarios anzuzeigen
      console.log(`🎮 NEUES SZENARIO GESTARTET: Level ${newSituationIndex + 1}`);
      console.log(`📝 Beschreibung: ${newMarketSituation.description}`);
      
      // Aktualisiere den ActionTracker mit der neuen Szenario-ID
      ActionTracker.setCurrentScenario(newSituationIndex);
      console.log(`ActionTracker: Szenario-ID auf ${newSituationIndex} gesetzt`);
      
      return {
        ...state,
        currentSituationIndex: newSituationIndex,
        stepsInCurrentSituation: 0,
        marketSituation: {
          description: newMarketSituation.description,
          recommendedTool: newMarketSituation.recommendedTool,
          toolDescription: newMarketSituation.toolDescription,
          expectedOutcome: newMarketSituation.expectedOutcomes[0]
        },
        showScenarioCompletionPopup: false
      };
    }

    case 'SHOW_SCENARIO_COMPLETION_POPUP':
      console.log(`🏁 SZENARIO BEENDET: Level ${state.currentSituationIndex + 1}`);
      return {
        ...state,
        showScenarioCompletionPopup: true,
        isAutoProgressPaused: true
      };

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Beim ersten Laden des Spiels anzeigen, dass Level 1 gestartet wurde
  useEffect(() => {
    console.log(`🎮 SPIEL GESTARTET: Level 1`);
    console.log(`📝 Beschreibung: ${marketSituations[0].description}`);
    
    // Setze die Szenario-ID im ActionTracker auf 0 (Level 1)
    ActionTracker.setCurrentScenario(0);
    console.log(`ActionTracker: Szenario-ID auf 0 gesetzt (Level 1)`);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!state.isAutoProgressPaused) {
      timer = setInterval(() => {
        const now = Date.now();
        if (now - state.lastAutoUpdate >= 1000) { // Update every 1 second in play mode (changed from 3000)
          dispatch({ type: 'ADVANCE_TIME' });
        }
      }, 100); // Check every 100ms
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isAutoProgressPaused, state.lastAutoUpdate]);

  // Check game state and trigger consultations when necessary
  useEffect(() => {
    const totalValue = state.portfolio.reduce((total, item) => {
      const currentPrice = state.currentPrices[item.sector.name] || item.sector.currentPrice;
      return total + (currentPrice * item.quantity);
    }, state.capital);

    const initialValue = 100000; // Initial capital
    const lossPercentage = ((totalValue - initialValue) / initialValue) * 100;

    if (lossPercentage < -10 && state.mistakes > state.lastConsultation) {
      // Logic for consultation could be implemented here
      dispatch({ type: 'UPDATE_PRICES' }); // Reset prices after consultation
    }
  }, [state.portfolio, state.currentPrices, state.mistakes, state.lastConsultation, state.capital]);

  // Effect for displaying market situations and tools
  useEffect(() => {
    if (state.currentMarketSituation) {
      const situation = marketSituations.find(s => s.description === state.currentMarketSituation);
      if (situation) {
        console.log('New Market Situation:', state.currentMarketSituation);
        console.log('New Tool Available:', situation.toolDescription);
      }
    }
  }, [state.currentMarketSituation]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

/**
 * Debug-Funktion - Führt statistische Tests für das aktuelle Szenario aus und loggt sie in die Konsole
 * @param sectors Die Sektoren
 * @param situation Die aktuelle Marktsituation
 * @param priceHistory Die Preishistorie
 */
export function runDebugStatisticalTests(
  sectors: Sector[], 
  situation: MarketSituation, 
  priceHistory: {[sectorName: string]: {prices: number[], timestamp: number}}
): void {
  const { testCriteria } = situation;

  // Helper function to get returns for a sector
  const getReturns = (sectorName: string) => {
    const history = priceHistory[sectorName];
    if (!history || history.prices.length < 2) return [];
    
    const returns = [];
    for (let i = 1; i < history.prices.length; i++) {
      returns.push((history.prices[i] - history.prices[i-1]) / history.prices[i-1]);
    }
    return returns;
  };

  // Get all sector names
  const sectorNames = sectors.map(s => s.name);
  
  // Group sectors by name for easier lookup
  const sectorsByName = sectorNames.reduce((acc, name) => {
    acc[name] = sectors.filter(s => s.name === name);
    return acc;
  }, {} as {[key: string]: Sector[]});

  // Determine test type based on data
  const techReturns = situation.performanceGroups.positive
    .map(symbol => getReturns(symbol))
    .flat();
  const otherReturns = situation.performanceGroups.negative
    .map(symbol => getReturns(symbol))
    .flat();

  // Check if data is categorical (only contains 0, 1, 2)
  const isCategoricalData = (data: number[]) => 
    data.every(v => v === 0 || v === 1 || v === 2);

  const isTechCategorical = isCategoricalData(techReturns);
  const isOtherCategorical = isCategoricalData(otherReturns);

  // Choose test type based on data type
  if (isTechCategorical && isOtherCategorical) {
    // Compare sector distribution changes
    const observed = sectorNames.map(sectorName => {
      const sectorGroup = sectorsByName[sectorName];
      return [
        sectorGroup.filter(s => situation.performanceGroups.positive.includes(s.name)).length,
        sectorGroup.filter(s => situation.performanceGroups.neutral.includes(s.name)).length,
        sectorGroup.filter(s => situation.performanceGroups.negative.includes(s.name)).length
      ];
    });
    
    // Calculate expected values (uniform distribution)
    const expected = sectorNames.map(sectorName => {
      const groupSize = sectorsByName[sectorName].length;
      return [groupSize/3, groupSize/3, groupSize/3];
    });
    
    const pValue = performChiSquareTest(observed, expected);
    console.log('Debug Chi-Square Test Results:', { pValue, significant: pValue < testCriteria.threshold });
  } else {
    // Use T-Test for numerical data
    const pValue = performTTest(techReturns, otherReturns);
    console.log('Debug T-Test Results:', { pValue, significant: pValue < testCriteria.threshold });
  }
} 