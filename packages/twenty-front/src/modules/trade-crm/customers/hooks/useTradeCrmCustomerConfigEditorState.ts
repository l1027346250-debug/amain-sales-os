import { useEffect, useState } from 'react';

import {
  type CustomerConfigEditorState,
  type CustomerConfigTagInputState,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigWorkspace';

export const useTradeCrmCustomerConfigEditorState = (
  hasUnsavedChanges: boolean,
) => {
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [groupParentId, setGroupParentId] = useState<string | null>(null);
  const [newTagLabels, setNewTagLabels] = useState<CustomerConfigTagInputState>(
    {
      company: '',
      mine: '',
      subordinate: '',
    },
  );
  const [tagEditorValues, setTagEditorValues] =
    useState<CustomerConfigEditorState>({});
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [sourceEditorValues, setSourceEditorValues] =
    useState<CustomerConfigEditorState>({});
  const [importFileName, setImportFileName] = useState('');

  useEffect(() => {
    if (hasUnsavedChanges) {
      return;
    }

    setNewGroupLabel('');
    setGroupParentId(null);
    setNewTagLabels({
      company: '',
      mine: '',
      subordinate: '',
    });
    setTagEditorValues({});
    setNewSourceLabel('');
    setSourceEditorValues({});
    setImportFileName('');
  }, [hasUnsavedChanges]);

  const onNewTagLabelChange = (
    scope: keyof CustomerConfigTagInputState,
    value: string,
  ) => {
    setNewTagLabels((currentState) => ({
      ...currentState,
      [scope]: value,
    }));
  };

  const onTagEditorValueChange = (key: string, value: string) => {
    setTagEditorValues((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  };

  const clearTagEditorValue = (key: string) => {
    setTagEditorValues((currentState) => {
      const nextState = { ...currentState };

      delete nextState[key];

      return nextState;
    });
  };

  const onSourceEditorValueChange = (key: string, value: string) => {
    setSourceEditorValues((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  };

  const clearSourceEditorValue = (key: string) => {
    setSourceEditorValues((currentState) => {
      const nextState = { ...currentState };

      delete nextState[key];

      return nextState;
    });
  };

  return {
    clearSourceEditorValue,
    clearTagEditorValue,
    groupParentId,
    importFileName,
    newGroupLabel,
    newSourceLabel,
    newTagLabels,
    onNewTagLabelChange,
    onSourceEditorValueChange,
    onTagEditorValueChange,
    setGroupParentId,
    setImportFileName,
    setNewGroupLabel,
    setNewSourceLabel,
    sourceEditorValues,
    tagEditorValues,
  };
};
