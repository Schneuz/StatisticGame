import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useGame, marketSituations } from '../contexts/GameContext';
import BarChartIcon from '@mui/icons-material/BarChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import { AnalysisPopup } from './AnalysisPopup';

// Mapping from scenario to image filename
const scenarioImageFileMap: Record<string, string> = {
  "Elrond's valley shimmers under a canopy of stars. Taverns overflow with mead, bakers serve warm honeyed lembas, and artisans craft tirelessly. Caravans roll out daily with festival goods. Bandits lurk in moonless gorges; armed escorts become scarce.": 'Sternenfest in Rivendel bei Nacht.png',
  "War drums thunder across the Pelennor Fields. Behind white walls, forges hammer, healers stack herbs, and citizens hoard grain. Traders avoid the main roads, and luxury goods gather dust.": 'Minas Tirith bei Dämmerung.png',
  "An unrelenting sun scorches Rohan's Eastfold. Wells dry up, fields turn to dust, herds thin out. Stonemasons and well-diggers roam the lands, and healers prepare fever remedies.": 'Sonnengebranntes Dorfbild in Rohan.png',
  "Deep in Moria's shadows, new Mithril veins gleam. Messengers race over mountain passes; investor camps spring up outside the East Gate. Precious metal prices skyrocket.": 'Glanzendes Mithril in Zwergenhalle.png',
  "Black longships loom at the mouth of the Anduin. Merchants are raided, wine barrels stolen, iron sunk. Overland routes become congested; wagon drivers demand hazard pay.": 'Küsten-Dorf im Belagerungsflammen.png',
  "A new sapling of the White Tree blossoms in Minas Tirith's courtyard. Pilgrims flood the streets, inns overflow, silver tree amulets sell briskly.": 'Minas Tirith im Morgengold.png',
  "In the deep green of Fangorn, the Ents forbid the felling of any living wood. Timber prices crash; stonemasons rejoice; harvests flourish.": 'Entmoot im Alten Wald.png',
  "Deep inside a rocky cavern, goblin torches flicker over raw gemstones, steaming potions, and ticking gears. Traders pay heavy tolls; precious metals shine.": 'Unterirdischer Goblinmarkt im Nebel.png',
  "By flickering torchlight, a Dwarf King and an Elf Lord forge an alliance: gemstones for silk, knife steel for crystal harps. Artisans and glassblowers celebrate.": 'Allianz im nächtlichen Wald.png',
  "Dense mists swallowed Bree's alleys. Strangers buy up stables and inns; blacksmiths sell locks faster than they forge them. Thieves prowled the darkness.": 'Nebel über Bree bei Nacht.png',
};

const placeholder = '/no-image.png';

const scenarioDescriptions: Record<string, string> = {
  "Elrond's valley shimmers under a canopy of stars. Taverns overflow with mead, bakers serve warm honeyed lembas, and artisans craft tirelessly. Caravans roll out daily with festival goods. Bandits lurk in moonless gorges; armed escorts become scarce.": `Elrond's valley shimmers under a canopy of stars. Taverns overflow with mead, bakers serve warm honeyed lembas, and artisans craft tirelessly. Caravans roll out daily with festival goods. Bandits lurk in moonless gorges; armed escorts become scarce.`,
  "War drums thunder across the Pelennor Fields. Behind white walls, forges hammer, healers stack herbs, and citizens hoard grain. Traders avoid the main roads, and luxury goods gather dust.": `War drums thunder across the Pelennor Fields. Behind white walls, forges hammer, healers stack herbs, and citizens hoard grain. Traders avoid the main roads, and luxury goods gather dust.`,
  "An unrelenting sun scorches Rohan's Eastfold. Wells dry up, fields turn to dust, herds thin out. Stonemasons and well-diggers roam the lands, and healers prepare fever remedies.": `An unrelenting sun scorches Rohan's Eastfold. Wells dry up, fields turn to dust, herds thin out. Stonemasons and well-diggers roam the lands, and healers prepare fever remedies.`,
  "Deep in Moria's shadows, new Mithril veins gleam. Messengers race over mountain passes; investor camps spring up outside the East Gate. Precious metal prices skyrocket.": `Deep in Moria's shadows, new Mithril veins gleam. Messengers race over mountain passes; investor camps spring up outside the East Gate. Precious metal prices skyrocket.`,
  "Black longships loom at the mouth of the Anduin. Merchants are raided, wine barrels stolen, iron sunk. Overland routes become congested; wagon drivers demand hazard pay.": `Black longships loom at the mouth of the Anduin. Merchants are raided, wine barrels stolen, iron sunk. Overland routes become congested; wagon drivers demand hazard pay.`,
  "A new sapling of the White Tree blossoms in Minas Tirith's courtyard. Pilgrims flood the streets, inns overflow, silver tree amulets sell briskly.": `A new sapling of the White Tree blossoms in Minas Tirith's courtyard. Pilgrims flood the streets, inns overflow, silver tree amulets sell briskly.`,
  "In the deep green of Fangorn, the Ents forbid the felling of any living wood. Timber prices crash; stonemasons rejoice; harvests flourish.": `In the deep green of Fangorn, the Ents forbid the felling of any living wood. Timber prices crash; stonemasons rejoice; harvests flourish.`,
  "Deep inside a rocky cavern, goblin torches flicker over raw gemstones, steaming potions, and ticking gears. Traders pay heavy tolls; precious metals shine.": `Deep inside a rocky cavern, goblin torches flicker over raw gemstones, steaming potions, and ticking gears. Traders pay heavy tolls; precious metals shine.`,
  "By flickering torchlight, a Dwarf King and an Elf Lord forge an alliance: gemstones for silk, knife steel for crystal harps. Artisans and glassblowers celebrate.": `By flickering torchlight, a Dwarf King and an Elf Lord forge an alliance: gemstones for silk, knife steel for crystal harps. Artisans and glassblowers celebrate.`,
  "Dense mists swallowed Bree's alleys. Strangers buy up stables and inns; blacksmiths sell locks faster than they forge them. Thieves prowled the darkness.": `Dense mists swallowed Bree's alleys. Strangers buy up stables and inns; blacksmiths sell locks faster than they forge them. Thieves prowled the darkness.`,
};

function normalizeText(text: string): string {
  return text
    .replace(/[''`´]/g, "'") // typographische Apostrophe vereinheitlichen
    .replace(/\s+/g, ' ') // Mehrfach-Leerzeichen zu einem
    .trim()
    .toLowerCase();
}

function getScenarioKey(description?: string): string | undefined {
  if (!description) return undefined;
  const normDesc = normalizeText(description).split(' ').slice(0, 6).join(' ');
  for (const key of Object.keys(scenarioDescriptions)) {
    const normKey = normalizeText(key).split(' ').slice(0, 6).join(' ');
    if (normDesc === normKey) return key;
  }
  // Fallback: substring match
  for (const key of Object.keys(scenarioDescriptions)) {
    if (normalizeText(description).includes(normalizeText(key).slice(0, 20))) return key;
  }
  return undefined;
}

function getScenarioImage(scenarioKey?: string): string {
  if (!scenarioKey) return placeholder;
  const file = scenarioImageFileMap[scenarioKey];
  if (!file) return placeholder;
  try {
    // @ts-ignore
    return require(`./Images/${file}`);
  } catch (e) {
    return placeholder;
  }
}

function getScenarioTitleAndDescription(description: string): { title: string; rest: string } {
  const firstPeriod = description.indexOf('.') + 1;
  if (firstPeriod > 0) {
    return {
      title: description.slice(0, firstPeriod).trim(),
      rest: description.slice(firstPeriod).trim(),
    };
  }
  return { title: description, rest: '' };
}

type TestType = 'ttest' | 'chisquare' | null;

interface TestInfo {
  icon: React.ReactNode;
  color: string;
  label: string;
  type: TestType;
}

function getTestIconAndColor(hypothesis: string): TestInfo {
  if (hypothesis.toLowerCase().includes('t-test')) {
    return { icon: <FunctionsIcon sx={{ color: '#4a90e2', mr: 1 }} />, color: '#4a90e2', label: 'T-Test', type: 'ttest' };
  }
  if (hypothesis.toLowerCase().includes('chi')) {
    return { icon: <BarChartIcon sx={{ color: '#e2c14a', mr: 1 }} />, color: '#e2c14a', label: 'Chi²', type: 'chisquare' };
  }
  return { icon: null, color: '#fff', label: '', type: null };
}

export const HeaderWithScenario: React.FC = () => {
  const { state } = useGame();
  const descriptionFromContext = state.marketSituation?.description;
  const scenarioKey = getScenarioKey(descriptionFromContext);
  const image = getScenarioImage(scenarioKey);
  const description = scenarioKey ? scenarioDescriptions[scenarioKey] : '';
  const currentIndex = state.currentSituationIndex ?? 0;
  const hypotheses = marketSituations[currentIndex]?.hypotheses || [];

  // Split into title and rest
  const { title, rest } = getScenarioTitleAndDescription(description);

  // Dialog states
  const [open, setOpen] = useState(false);
  const [selectedHypothesis, setSelectedHypothesis] = useState<string | null>(null);

  const handleHypothesisClick = (hypothesis: string) => {
    setSelectedHypothesis(hypothesis);
    setOpen(true);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ width: '100%', height: 700, position: 'relative', background: '#222', borderRadius: 3, overflow: 'hidden' }}>
        <img
          src={image}
          alt={scenarioKey || 'Scenario'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </Box>
      <Paper elevation={4} sx={{ mt: -4, px: 4, py: 3, maxWidth: '100%', borderRadius: 3, background: '#181c24', position: 'relative', zIndex: 2 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>
          {title}
        </Typography>
        {rest && (
          <Typography variant="h6" sx={{ color: '#cfd8dc', fontWeight: 400, mb: 2 }}>
            {rest}
          </Typography>
        )}
        {hypotheses.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#4a90e2', mb: 1, fontWeight: 700 }}>
              Hypothesen:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {hypotheses.map((hyp: string, idx: number) => {
                const testInfo = getTestIconAndColor(hyp);
                // Split hypothesis into main text and test type
                const match = hyp.match(/(.*?)(\s*→\s*)(T-Test|Chi²)/i);
                const mainText = match ? match[1].trim() : hyp;
                const testType = match ? match[3] : '';
                return (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(44, 54, 80, 0.85)',
                      borderRadius: 3,
                      boxShadow: 3,
                      px: 3,
                      py: 2,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s, background 0.2s',
                      '&:hover': {
                        boxShadow: 8,
                        background: 'rgba(74, 144, 226, 0.15)',
                      },
                    }}
                    onClick={() => handleHypothesisClick(hyp)}
                  >
                    {testInfo.icon}
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 400, flex: 1 }}>
                      {mainText}
                      {testType && (
                        <Typography component="span" sx={{ color: testInfo.color, fontWeight: 700, ml: 1 }}>
                          {testType}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Analysis Popup */}
      <AnalysisPopup
        open={open}
        onClose={() => setOpen(false)}
        hypothesis={selectedHypothesis || ''}
      />
    </Box>
  );
}; 