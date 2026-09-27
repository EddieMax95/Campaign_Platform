import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CampaignQRCodeProps {
    campaignId: number | string;
}

export default function CampaignQRCode({ campaignId }: CampaignQRCodeProps) {
    const [qrData, setQrData] = useState<{
        candidate_name: string;
        campaign_name: string;
        whatsapp_link: string;
        qr_code_base64: string;
    } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!campaignId) return;

        const fetchQRCode = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get(`http://127.0.0.1:8000/api/campaigns/${campaignId}/qr-code/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQrData(response.data);
            } catch (err: any) {
                console.error("Error fetching QR code:", err);
                setError("Failed to load registration scan code.");
            } finally {
                setLoading(false);
            }
        };

        fetchQRCode();
    }, [campaignId]);

    if (loading) return <div className="p-4 text-center text-gray-500">Generating candidate scan code...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-sm mx-auto border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">{qrData?.candidate_name}</h3>
            <p className="text-sm text-gray-600 mb-4">{qrData?.campaign_name}</p>
            
            {qrData?.qr_code_base64 && (
                <div className="flex justify-center mb-4">
                    <img 
                        src={qrData.qr_code_base64} 
                        alt="WhatsApp Registration QR Code" 
                        className="w-48 h-48 object-contain border p-2 rounded bg-gray-50"
                    />
                </div>
            )}
            
            <p className="text-xs text-gray-500 mb-4">
                Scan this code with a phone camera to instantly start automated WhatsApp registration.
            </p>

            <button 
                onClick={() => window.print()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition duration-200 text-sm shadow-sm"
            >
                Print Poster / QR Code
            </button>
        </div>
    );
}