"use client";
import { Facebook, Twitter, Mail, Link as LinkIcon } from "lucide-react";

interface ShareListingProps {
  listingUrl: string;
  listingTitle: string;
  listingPrice?: string;
}

export default function ShareListing({ listingUrl, listingTitle, listingPrice }: ShareListingProps) {
  const shareText = `Check out this property: ${listingTitle}${listingPrice ? ` for ${listingPrice}` : ''}`;
  const fullUrl = typeof window !== 'undefined' ? window.location.origin + listingUrl : listingUrl;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(fullUrl)}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      alert('Link copied to clipboard!');
    } catch {
      alert('Failed to copy link');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Share:</span>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </a>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors"
        aria-label="Share on Twitter"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>
      <a
        href={shareLinks.email}
        className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
        aria-label="Share via email"
        title="Share via email"
      >
        <Mail className="w-4 h-4" />
      </a>
      <button
        onClick={copyLink}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Copy link"
        title="Copy link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
