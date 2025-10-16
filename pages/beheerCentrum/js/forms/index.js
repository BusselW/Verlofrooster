/**
 * index.js - Forms module exports
 * Central place to import all form components
 */

import { BaseForm } from './BaseForm.js';
import { MedewerkerForm } from './MedewerkerForm.js';
import { TeamForm } from './TeamForm.js';
import { VerlofredenenForm } from './VerlofredenenForm.js';
import { DagIndicatorForm } from './DagIndicatorForm.js';
import { VerlofForm } from './VerlofForm.js';
import { CompensatieUrenForm } from './CompensatieUrenForm.js';
import { UrenPerWeekForm } from './UrenPerWeekForm.js';
import { SeniorsForm } from './SeniorsForm.js';
import { MededelingForm } from './MededelingForm.js';
import { ZittingsvrijOpmaakForm } from './ZittingsvrijOpmaakForm.js';
import { GebruikersInstellingenForm } from './GebruikersInstellingenForm.js';
import { KeuzelijstFunctiesForm } from './KeuzelijstFunctiesForm.js';
import { IncidenteelZittingVrijForm } from './IncidenteelZittingVrijForm.js';
import { StatuslijstOptiesForm } from './StatuslijstOptiesForm.js';
import { GenericForm } from './GenericForm.js';

// Re-export all forms
export { 
    BaseForm, 
    MedewerkerForm, 
    TeamForm, 
    VerlofredenenForm, 
    DagIndicatorForm,
    VerlofForm,
    CompensatieUrenForm,
    UrenPerWeekForm,
    SeniorsForm,
    MededelingForm,
    ZittingsvrijOpmaakForm,
    GebruikersInstellingenForm,
    KeuzelijstFunctiesForm,
    IncidenteelZittingVrijForm,
    StatuslijstOptiesForm,
    GenericForm 
};

// Form factory function to get the right form component
export const getFormComponent = (tabType) => {
    const formMap = {
        'medewerkers': MedewerkerForm,
        'teams': TeamForm,
        'verlofredenen': VerlofredenenForm,
        'dagenindicators': DagIndicatorForm,
        'verlof': VerlofForm,
        'compensatieuren': CompensatieUrenForm,
        'urenperweek': UrenPerWeekForm,
        'seniors': SeniorsForm,
        'mededeling': MededelingForm,
        'zittingsvrijopmaak': ZittingsvrijOpmaakForm,
        'gebruikersinstellingen': GebruikersInstellingenForm,
        'keuzelijstfuncties': KeuzelijstFunctiesForm,
        'incidenteelzittingvrij': IncidenteelZittingVrijForm,
        'statuslijstopties': StatuslijstOptiesForm,
    };

    return formMap[tabType] || GenericForm; // Fallback to GenericForm
};