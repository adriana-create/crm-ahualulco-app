import React from 'react';
import type { ChangeLogEntry } from '../types';
import { ClockIcon } from './icons/ClockIcon';

interface ChangeHistoryLogProps {
  history: ChangeLogEntry[];
}

const ChangeHistoryLog: React.FC<ChangeHistoryLogProps> = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 italic">No hay historial de cambios para este cliente.</p>
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {history.map((log, index) => (
                    <li key={index}>
                        <div className="relative pb-8">
                            {index !== history.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                                        <ClockIcon className="h-5 w-5 text-gray-500" />
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-800">{log.description}</p>
                                    </div>
                                    <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                        <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleString()}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChangeHistoryLog;